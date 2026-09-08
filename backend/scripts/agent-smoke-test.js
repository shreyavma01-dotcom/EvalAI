/* Temporary smoke test for the agent's pure decision/verification/observation modules. */
const { verifyOcrResult, isBetterOcr, verifyEvaluation } = require('../src/services/agent/verification.service');
const { decidePreprocessing, planOcrStrategies, classifyQuestion, adoptReanalysis } = require('../src/services/agent/decision.service');
const { observePageQuality, summarizeObservation } = require('../src/services/agent/observation.service');
const { createAgentState, record, toTraceDocuments } = require('../src/services/agent/agentState.service');
const sharp = require('sharp');

const assert = (label, cond) => console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);

// OCR verification
assert('empty text insufficient', verifyOcrResult({ text: '' }).status === 'insufficient');
assert('short text insufficient', verifyOcrResult({ text: 'hi' }).status === 'insufficient');
assert('low tesseract confidence weak', verifyOcrResult({ text: 'The answer is four apples', confidence: 0.3, confidenceScale: 'continuous' }).status === 'weak');
assert('good tesseract confidence sufficient', verifyOcrResult({ text: 'The answer is four apples', confidence: 0.9, confidenceScale: 'continuous' }).status === 'sufficient');
assert('binary provider judged on text', verifyOcrResult({ text: 'The mitochondria is the powerhouse of the cell', confidence: 1, confidenceScale: 'binary' }).status === 'sufficient');

const a = { result: { text: 'short' }, verdict: { status: 'insufficient' } };
const b = { result: { text: 'a much longer result' }, verdict: { status: 'weak' } };
assert('better OCR picked', isBetterOcr(b, a) === true);

assert('eval valid', verifyEvaluation({ questions: [{ questionNumber: 1, page: 1, obtainedMarks: 2, maxMarks: 5, status: 'partial' }] }, 1).status === 'valid');
assert('eval invalid detected', verifyEvaluation({ questions: [{ questionNumber: 1, page: 9, obtainedMarks: 7, maxMarks: 5, status: 'weird' }] }, 1).status === 'invalid');

// Decisions
assert('good page: no preprocessing', decidePreprocessing({ issues: [] }).enhance === false);
assert('flagged page: enhance', decidePreprocessing({ issues: ['low_contrast', 'possible_blur'] }).enhance === true);
assert('3 bounded strategies planned', planOcrStrategies().length === 3);

assert('auto-evaluated', classifyQuestion({ confidence: 0.85, studentAnswer: 'photosynthesis', status: 'correct' }).outcome === 'AUTO_EVALUATED');
assert('needs additional analysis', classifyQuestion({ confidence: 0.5, studentAnswer: 'photosynthesis', status: 'partial' }).outcome === 'NEEDS_ADDITIONAL_ANALYSIS');
assert('needs teacher review', classifyQuestion({ confidence: 0.2, studentAnswer: 'photosynthesis', status: 'partial' }).outcome === 'NEEDS_TEACHER_REVIEW');
assert('unreadable answer escalated', classifyQuestion({ confidence: 0.9, studentAnswer: '', status: 'incorrect' }).outcome === 'NEEDS_TEACHER_REVIEW');
assert('unattempted is fine', classifyQuestion({ confidence: 0.9, studentAnswer: '', status: 'unattempted' }).outcome === 'AUTO_EVALUATED');

assert('adopts better re-analysis', adoptReanalysis({ confidence: 0.4, obtainedMarks: 1, maxMarks: 2 }, { confidence: 0.8, obtainedMarks: 2, maxMarks: 2 }).confidence === 0.8);
assert('rejects worse re-analysis', adoptReanalysis({ confidence: 0.8 }, { confidence: 0.5 }) === null);

// Agent state + trace
const state = createAgentState({ evaluationId: 'test', onAgentEvent: (e) => console.log('  emit:', e.type, '-', e.message) });
record(state, { type: 'goal', step: 'goal', title: 'Goal started', message: 'test goal' });
record(state, { type: 'observation', step: 'ocr', title: 'obs', message: 'page 1 looks clear' });
record(state, { type: 'decision', step: 'ocr', title: 'dec', message: 'OCR directly' });
record(state, { type: 'escalation', step: 'evaluating', title: 'esc', message: 'Q2 escalated' });
assert('trace recorded', state.trace.length === 4 && state.observations.length === 1 && state.escalations.length === 1);
assert('trace documents shaped', toTraceDocuments(state)[0].type === 'goal' && toTraceDocuments(state)[0].createdAt instanceof Date);

// Observation on synthetic pages
(async () => {
  // Paper-toned page with many anti-aliased dark strokes (text-like detail).
  const strokes = Array.from({ length: 300 }, (_, i) => {
    const x = (i * 89) % 1000 + 60;
    const y = (i * 127) % 1400 + 80;
    const w = 40 + ((i * 31) % 220);
    const gray = 40 + ((i * 17) % 70);
    return `<rect x="${x}" y="${y}" width="${w}" height="7" rx="3" fill="rgb(${gray},${gray},${gray})"/>`;
  }).join('');
  const realistic = await sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="1200" height="1600" fill="#f2eee6"/>${strokes}</svg>`)
  ).blur(0.8).png().toBuffer();
  const blank = await sharp({ create: { width: 800, height: 1100, channels: 3, background: '#111111' } }).png().toBuffer();

  const clearObs = await observePageQuality(realistic, 1);
  const blankObs = await observePageQuality(blank, 2);
  console.log('clear page observation:', JSON.stringify(clearObs));
  console.log('  ->', summarizeObservation(clearObs));
  console.log('blank page observation:', JSON.stringify(blankObs));
  console.log('  ->', summarizeObservation(blankObs));
  assert('clear page rated good/fair', clearObs.quality === 'good' || clearObs.quality === 'fair');
  assert('blank page flagged', blankObs.issues.includes('nearly_blank') && blankObs.quality === 'poor');
})().catch((err) => { console.error('OBSERVATION ERROR', err); process.exit(1); });