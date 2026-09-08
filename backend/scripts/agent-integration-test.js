/**
 * Integration smoke test for the agentic evaluation controller.
 *
 * Hermetic: HTTP calls to Google Vision / Gemini are stubbed at the axios
 * boundary (the .env keys may be absent or invalid). Everything else — image
 * preparation, enhancement, the agent loop, verification, annotation,
 * storage, PDF and trace persistence — runs the real project code.
 *
 * Scenarios:
 *   A) clean input → auto-evaluated + one uncertain question escalated
 *   B) low-quality OCR → image enhancement selected → retry succeeds
 *   C) OCR fails on every page → friendly 422
 *   D) uncertain question → focused re-analysis improves confidence → adopted
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios');

const ocrService = require('../src/services/ocr.service');
const { runAgenticEvaluation } = require('../src/services/agent/evaluationAgent.service');

const assert = (label, cond) => console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);

const GOOD_TEXT = 'Q1. What is the capital of France? The capital of France is Paris.';

function visionResponse(text) {
  if (!text) return {};
  return {
    fullTextAnnotation: {
      text,
      width: 1200,
      height: 1600,
      pages: [
        {
          blocks: [
            { boundingBox: { vertices: [{ x: 10, y: 10 }, { x: 1100, y: 10 }, { x: 1100, y: 300 }, { x: 10, y: 300 }] }, text },
          ],
        },
      ],
    },
  };
}

// --- HTTP stubs (per-scenario behaviour) ---
let visionText = () => GOOD_TEXT;
let geminiPayloads = [];
let geminiCalls = 0;
const realAxiosPost = axios.post.bind(axios);
axios.post = async (url, ...rest) => {
  if (String(url).includes('vision.googleapis.com')) {
    return { data: { responses: [visionResponse(visionText())] } };
  }
  if (String(url).includes('generativelanguage.googleapis.com')) {
    geminiCalls += 1;
    const payload = geminiPayloads[Math.min(geminiCalls, geminiPayloads.length) - 1];
    return { data: { candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] } };
  }
  return realAxiosPost(url, ...rest);
};

async function makePage() {
  const strokes = Array.from({ length: 300 }, (_, i) => {
    const x = ((i * 89) % 1000) + 60;
    const y = ((i * 127) % 1400) + 80;
    const w = 40 + ((i * 31) % 220);
    const g = 40 + ((i * 17) % 70);
    return `<rect x="${x}" y="${y}" width="${w}" height="7" rx="3" fill="rgb(${g},${g},${g})"/>`;
  }).join('');
  const buffer = await sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="1200" height="1600" fill="#f2eee6"/>${strokes}</svg>`)
  ).blur(0.3).png().toBuffer();
  return { buffer, mimetype: 'image/png' };
}

const events = [];
const onAgentEvent = (e) => events.push(e);
const onStage = () => {};

function q1(confidence, obtainedMarks = 2, maxMarks = 2) {
  return {
    questionNumber: 1, question: 'What is the capital of France?', page: 1,
    studentAnswer: 'Paris', status: obtainedMarks === maxMarks ? 'correct' : 'partial',
    correctedAnswer: 'Paris', whyWrong: '', missingPoints: [], suggestion: '',
    teacherComment: 'Correct', teacherNote: '', markups: [],
    obtainedMarks, maxMarks, confidence,
  };
}

function cleanup(id) {
  const dir = path.resolve(process.cwd(), 'uploads', 'evaluations', id);
  fs.rmSync(dir, { recursive: true, force: true });
}

(async () => {
  // ---------- Scenario A: clean OCR, one uncertain question escalated ----------
  visionText = () => GOOD_TEXT;
  geminiCalls = 0;
  geminiPayloads = [
    { questions: [q1(0.92), { ...q1(0.55, 1), questionNumber: 2, question: 'Define gravity', studentAnswer: 'a force', status: 'partial' }], obtainedMarks: 3, totalMarks: 4, teacherFeedback: 'Good, but Q2 needs depth.', topicsToImprove: ['Physics'] },
    // Focused recheck of Q2 — inconclusive (same confidence) → escalation.
    { questions: [{ ...q1(0.55, 1), questionNumber: 2, question: 'Define gravity', studentAnswer: 'a force', status: 'partial' }], obtainedMarks: 1, totalMarks: 2, teacherFeedback: 'x', topicsToImprove: [] },
  ];
  events.length = 0;
  const record = await runAgenticEvaluation({
    evaluationId: 'smoke-agent-a',
    sheetPages: [await makePage()],
    config: { subject: 'Physics' },
    onStage,
    onAgentEvent,
  });

  assert('A: escalated record (Q2 confidence 0.55)', record.status === 'needs_teacher_review');
  assert('A: agentTrace persisted', Array.isArray(record.agentTrace) && record.agentTrace.length > 5);
  assert('A: trace covers the full loop',
    ['goal', 'observation', 'decision', 'action', 'verification', 'adaptation', 'escalation', 'completion']
      .every((t) => {
        const ok = record.agentTrace.some((e) => e.type === t);
        if (!ok) console.log('  missing trace type:', t);
        return ok;
      }));
  console.log('  trace types:', record.agentTrace.map((e) => e.type).join(','));
  assert('A: outcome summary lists Q2', record.agentOutcome.escalatedQuestionNumbers.includes(2));
  assert('A: escalation flags on questions', record.questions[1].needsTeacherReview === true && record.questions[0].needsTeacherReview === undefined);
  assert('A: page stored with quality + confidence', record.pages[0].quality === 'good' && record.pages[0].ocrConfidence >= 0);
  assert('A: corrected pdf written', !!record.correctedPdfUrl && fs.existsSync(path.join(process.cwd(), record.correctedPdfUrl.replace('/uploads/', 'uploads/'))));
  assert('A: live agent events emitted', events.length > 5);
  cleanup('smoke-agent-a');

  // ---------- Scenario B: low-quality OCR improves after image enhancement ----------
  let visionCalls = 0;
  visionText = () => {
    visionCalls += 1;
    return visionCalls === 1 ? '' : GOOD_TEXT; // 1st (direct) attempt: nothing; enhanced retry: good
  };
  geminiCalls = 0;
  geminiPayloads = [
    { questions: [q1(0.95)], obtainedMarks: 2, totalMarks: 2, teacherFeedback: 'Great.', topicsToImprove: [] },
  ];
  events.length = 0;
  const recordB = await runAgenticEvaluation({ evaluationId: 'smoke-agent-b', sheetPages: [await makePage()], config: { subject: 'General' }, onStage, onAgentEvent });
  assert('B: completed after enhancement retry', recordB.status === 'completed');
  assert('B: adaptation recorded', events.some((e) => e.type === 'adaptation'));
  assert('B: OCR attempts bounded (<=3 strategies)', events.filter((e) => e.type === 'action' && /OCR attempt/.test(e.title)).length <= 3);
  assert('B: recovered text used', recordB.pages[0].ocrText.includes('Paris'));
  cleanup('smoke-agent-b');

  // ---------- Scenario C: OCR fails on every page ----------
  visionText = () => '';
  ocrService.tesseractOcr = async () => ({ text: '', confidence: 0, words: [] });
  events.length = 0;
  let failed = null;
  try {
    await runAgenticEvaluation({ evaluationId: 'smoke-agent-c', sheetPages: [await makePage()], config: { subject: 'General' }, onStage, onAgentEvent });
  } catch (err) {
    failed = err;
  }
  assert('C: friendly 422 failure', !!failed && failed.status === 422);
  assert('C: escalation trace recorded', events.some((e) => e.type === 'escalation'));
  assert('C: failed completion trace recorded', events.some((e) => e.type === 'completion' && e.title === 'Evaluation failed'));
  cleanup('smoke-agent-c');

  // ---------- Scenario D: uncertain question improved by focused re-analysis ----------
  visionText = () => GOOD_TEXT;
  ocrService.tesseractOcr = async () => ({ text: GOOD_TEXT, confidence: 90, words: [] });
  geminiCalls = 0;
  geminiPayloads = [
    { questions: [q1(0.5)], obtainedMarks: 1, totalMarks: 2, teacherFeedback: 'Partially right.', topicsToImprove: [] },
    // Focused re-read of the same page finds better support → adopted.
    { questions: [q1(0.85)], obtainedMarks: 2, totalMarks: 2, teacherFeedback: 'Now complete.', topicsToImprove: [] },
  ];
  events.length = 0;
  const recordD = await runAgenticEvaluation({ evaluationId: 'smoke-agent-d', sheetPages: [await makePage()], config: { subject: 'General' }, onStage, onAgentEvent });
  assert('D: completed after successful re-analysis', recordD.status === 'completed');
  assert('D: improved judgment adopted', recordD.questions[0].confidence === 0.85 && recordD.questions[0].obtainedMarks === 2);
  assert('D: no escalation needed', recordD.agentOutcome.escalatedQuestionNumbers.length === 0);
  assert('D: re-evaluation trace recorded', events.some((e) => e.type === 'adaptation' && /re-evaluated/.test(e.title)));
  cleanup('smoke-agent-d');

  console.log('\nAll integration smoke scenarios done.');
})().catch((err) => {
  console.error('SMOKE TEST ERROR:', err);
  process.exit(1);
});