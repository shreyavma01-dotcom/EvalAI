const axios = require('axios');
const { GEMINI_API_KEY, GEMINI_MODEL } = require('../config/env');
const logger = require('../utils/logger');

const MAX_PAGES_PER_REQUEST = 8;
const VALID_STATUSES = ['correct', 'partial', 'incorrect', 'unattempted'];
const VALID_MARKUP_TYPES = ['circle', 'underline', 'highlight', 'text'];

function extractJson(text) {
  const cleaned = String(text || '').replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildPrompt({ subject, pageOcr, pageCount, batchFirstPage, batchPageCount, batchIndex }) {
  const totalPages = pageCount;
  const pageText = Array.isArray(pageOcr)
    ? pageOcr
        .map(
          (entry, index) =>
            `--- Page ${batchFirstPage + index + 1} (this batch's image #${index}) ---\n` +
            `OCR of page ${batchFirstPage + index + 1}:\n${String(entry?.text || '').slice(0, 4000) || '(no text detected)'}`
        )
        .join('\n\n')
    : '(OCR not available)';

  return `You are an experienced, warm but strict school teacher correcting a student's handwritten answer sheet for the subject "${subject}". You correct this notebook exactly like a teacher would — reading every question, judging every answer, writing corrections on the page and giving genuine feedback.

You are correcting pages ${batchFirstPage + 1} to ${batchFirstPage + batchPageCount} of a ${totalPages}-page answer sheet. The images you receive in this batch are, in order: image #0 = page ${batchFirstPage + 1}, image #1 = page ${batchFirstPage + 2}, and so on. Page numbers are 1-based.

READING (Gemini Vision):
- Read the handwritten text DIRECTLY from the images. Use the OCR text below only as a hint to confirm messy handwriting, never as a replacement.
- Ignore notebook ruled lines, shadows and image noise.
- Correctly read paragraphs, lists, bullet points, math equations, tables, diagrams, chemical formulas and programming code.
- If the sheet mixes languages, read everything and answer in the same language as the student wrote (or English if the sheet is not in a clear language).
- Detect EVERY question on these pages. Numbering can be "Q1", "1.", "Question 4", "1)", roman numerals (i, ii, iii) or letters (a, b, c). Return the question text as written on the sheet.

EVALUATION (your own knowledge — NO answer key exists):
- No answer key or marking scheme is provided. Using ONLY your own subject knowledge of "${subject}", determine the correct answer for every question, then judge the student's answer semantically: accuracy, completeness, concept understanding, reasoning. NOT string matching.
- Grade like a fair teacher. Mark each question exactly one of: correct, partial, incorrect, unattempted.
- Assign internal marks (obtainedMarks out of maxMarks) quietly to calibrate your judgment — these are for the teacher's records, not shown to the student in this UI.

For EVERY question return:
- "questionNumber", "question" (as written on the sheet), "page" (1-based integer within ${batchFirstPage + 1}..${batchFirstPage + batchPageCount}), "studentAnswer" (verbatim what the student wrote), "bbox" (normalized 0-1 rectangle on that page's image tightly covering the answer region).
- "status": one of "correct", "partial", "incorrect", "unattempted".
- "correctedAnswer": the correct or ideal answer you construct yourself.
- "whyWrong": ONLY for incorrect questions — a short, kind explanation of why it is wrong.
- "missingPoints": ONLY for partial questions — up to 3 bullet points listing what was missed.
- "suggestion": a short improvement suggestion for any non-correct question.
- "teacherComment": a VERY SHORT note that a teacher would actually write on the page next to the answer. Pick from or model these: "Excellent", "Good", "Correct", "Best answer", "Revise", "Wrong", "Wrong Formula", "Incomplete", "Incomplete Definition", "Missing Step", "Need Explanation", "Not attempted", "Recheck calculation", "Write more clearly", "Spelling mistake", "Good attempt". Never invent long sentences here.
- "teacherNote": the correction text a teacher writes ON the page beside the answer (e.g. the correct word or number: "Charles Babbage", "70004 → 70003", "CPU = Central Processing Unit"). Empty string when nothing needs writing.
- "markups": teacher pen marks drawn on the page. An ARRAY of up to 4 objects. Use them to circle/underline/highlight the SPECIFIC wrong text, wrong number, wrong formula or misspelled word, and to place the corrected text. Each markup:
  {
    "type": "circle" | "underline" | "highlight" | "text",
    "bbox": { "left": 0..1, "top": 0..1, "width": 0..1, "height": 0..1 },   // small, tight box around the target region, normalized to that page's image
    "text": "optional short text to write next to this mark"
  }
  Rules for markups:
  - circle the wrong answer/word/number that needs correction (e.g. circle "Newton", text "→ Charles Babbage").
  - underline spelling mistakes or the erroneous keyword, text noting the fix.
  - highlight the phrase that needs attention.
  - for correct answers return NO markups (the system draws the green tick itself).
  - if nothing specific needs marking, return empty array.
- "obtainedMarks" and "maxMarks" as numbers.

At the TOP level of your JSON return:
- "teacherFeedback": 2-4 sentences of natural, specific teacher feedback about THIS student's performance on this sheet. Refer to what they actually wrote. Praise real strengths with concrete examples, point out specific errors, and say exactly what to practise. NEVER generic filler ("Good work, keep it up"). Sound like a real teacher checking a notebook.
- "topicsToImprove": an array of the specific topics/course units the student should revise (e.g. "Operating System", "Database Normalization", "Polynomials", "English Grammar", "Chemical Bonding", "Sorting algorithms"). 2-6 items.
- "obtainedMarks" and "totalMarks" totalled across the questions on these pages.

EXAMPLE — student wrote "Father of Computer = Newton":
  correct: false, so status "incorrect", correctedAnswer "Charles Babbage", teacherNote "Charles Babbage", teacherComment "Wrong — revise this fact", markup { type: "circle", bbox: { left: 0.3, top: 0.5, width: 0.18, height: 0.04 }, text: "→ Charles Babbage" }
  The circle should tightly enclose the wrong word "Newton".

OCR TEXT (page ${batchFirstPage + 1} through page ${batchFirstPage + batchPageCount}):
${pageText}

Return ONLY a valid JSON object — no markdown, no code fences. Shape:

{
  "questions": [
    {
      "questionNumber": 1,
      "question": "question text as written",
      "page": 1,
      "studentAnswer": "what the student wrote",
      "bbox": { "left": 0.1, "top": 0.15, "width": 0.8, "height": 0.06 },
      "status": "correct | partial | incorrect | unattempted",
      "correctedAnswer": "the correct answer",
      "whyWrong": "",
      "missingPoints": [],
      "suggestion": "",
      "teacherComment": "short on-page note",
      "teacherNote": "correction text to write on the page",
      "markups": [
        { "type": "circle", "bbox": { "left": 0.3, "top": 0.5, "width": 0.18, "height": 0.04 }, "text": "→ correction" }
      ],
      "obtainedMarks": 0,
      "maxMarks": 2,
      "confidence": 0.9
    }
  ],
  "teacherFeedback": "2-4 sentences of real teacher feedback",
  "topicsToImprove": ["Topic one", "Topic two"],
  "obtainedMarks": 8,
  "totalMarks": 12
}

GUIDELINES:
- "status" must be exactly one of the four valid values.
- "markups" — a max of 4; keep bounding boxes SMALL and precise (they are drawn directly on the image).
- "confidence" is 0-1; the system does not display it.
- sum of obtainedMarks equals the top-level obtainedMarks (you may include a small rounding note; minor differences are tolerated).
- Write teacherFeedback and topicsToImprove specifically for what was on these pages.`;
}

async function callGeminiBatch({ sheets, subject, pageOcr, pageCount, batchFirstPage, batchIndex }) {
  if (!GEMINI_API_KEY) {
    const error = new Error('Gemini API key is not configured. Add GEMINI_API_KEY to backend/.env.');
    error.status = 503;
    error.isOperational = true;
    throw error;
  }

  const batchPageCount = sheets.length;
  const prompt = buildPrompt({
    subject,
    pageOcr,
    pageCount,
    batchFirstPage,
    batchPageCount,
    batchIndex,
  });

  const parts = [{ text: prompt }];
  for (const sheet of sheets) {
    parts.push({ inlineData: { mimeType: sheet.mimeType, data: sheet.buffer.toString('base64') } });
  }

  let response;
  try {
    response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json',
        },
      },
      {
        params: { key: GEMINI_API_KEY },
        timeout: 180000,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    logger.error(`Gemini request failed (batch ${batchIndex}): ${err.message}`);
    const geminiError = new Error('Gemini evaluation failed — the model could not be reached.');
    geminiError.status = 502;
    geminiError.isOperational = true;
    throw geminiError;
  }

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = extractJson(text);
  if (!parsed) {
    logger.error(`Gemini returned unparseable content (batch ${batchIndex}):`, text?.slice(0, 500));
    const error = new Error('Gemini could not read the handwriting — reading failed. Try a clearer scan.');
    error.status = 422;
    error.isOperational = true;
    throw error;
  }
  return parsed;
}

/**
 * Runs a real Gemini evaluation across all sheet pages. Pages are processed
 * in small batches, then the per-question results are merged and normalized
 * into one teacher-style record.
 */
async function evaluateAnswerSheet({ sheetPages, subject, onStage }) {
  const pages = sheetPages || [];
  if (pages.length === 0) {
    const error = new Error('No answer sheet pages provided for evaluation.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  const pageCount = pages.length;
  const batches = [];
  for (let i = 0; i < pages.length; i += MAX_PAGES_PER_REQUEST) {
    batches.push({ pages: pages.slice(i, i + MAX_PAGES_PER_REQUEST), firstPage: i });
  }

  const merged = { questions: [], obtainedMarks: 0, totalMarks: 0, teacherFeedback: '', topicsToImprove: [] };
  let startPercent = 45;
  const span = 40;

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const batchPct = batches.length > 1 ? startPercent + Math.round((span * b) / batches.length) : startPercent;
    onStage?.('evaluating', batchPct, batches.length > 1 ? `Checking pages ${batch.firstPage + 1}–${batch.firstPage + batch.pages.length} of ${pageCount}` : 'Reading and checking answers');

    const parsed = await callGeminiBatch({
      sheets: batch.pages,
      subject,
      pageOcr: pages.slice(batch.firstPage, batch.firstPage + batch.pages.length),
      pageCount,
      batchFirstPage: batch.firstPage,
      batchIndex: b,
    });

    merged.questions.push(...(Array.isArray(parsed.questions) ? parsed.questions : []));
    merged.obtainedMarks += toNumber(parsed.obtainedMarks, 0);
    merged.totalMarks += toNumber(parsed.totalMarks, 0);

    if (parsed.teacherFeedback && String(parsed.teacherFeedback).trim().length > (merged.teacherFeedback || '').length) {
      merged.teacherFeedback = String(parsed.teacherFeedback).trim();
    }
    for (const topic of parsed.topicsToImprove || []) {
      if (topic && String(topic).trim() && !merged.topicsToImprove.includes(String(topic).trim())) {
        merged.topicsToImprove.push(String(topic).trim());
      }
    }
  }

  merged.topicsToImprove = merged.topicsToImprove.slice(0, 8);
  return normalizeResult(merged);
}

function normalizeAnnotations(rawStatus, rawMarkups) {
  const markups = [];
  if (Array.isArray(rawMarkups)) {
    for (const m of rawMarkups.slice(0, 4)) {
      if (!m || typeof m !== 'object') continue;
      const type = String(m.type || '').toLowerCase();
      if (!VALID_MARKUP_TYPES.includes(type)) continue;
      const bbox = m.bbox && typeof m.bbox === 'object' ? m.bbox : {};
      markups.push({
        type,
        bbox: {
          left: clamp(toNumber(bbox.left, 0), 0, 1),
          top: clamp(toNumber(bbox.top, 0), 0, 1),
          width: clamp(toNumber(bbox.width, 0.05), 0.001, 1),
          height: clamp(toNumber(bbox.height, 0.05), 0.001, 1),
        },
        text: String(m.text ?? ''),
      });
    }
  }
  return markups;
}

function normalizeResult(raw) {
  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .filter((q) => q && (q.questionNumber !== undefined || q.question))
        .map((q, index) => {
          const maxMarks = clamp(toNumber(q.maxMarks, 1), 0, 1000);
          const obtainedMarks = clamp(toNumber(q.obtainedMarks, 0), 0, maxMarks);
          const status = String(q.status || '').toLowerCase();
          const validStatus = VALID_STATUSES.includes(status)
            ? status
            : obtainedMarks >= maxMarks && maxMarks > 0
              ? 'correct'
              : obtainedMarks > 0
                ? 'partial'
                : 'unattempted';

          const bbox = q.bbox && typeof q.bbox === 'object'
            ? {
                left: clamp(toNumber(q.bbox.left, 0), 0, 1),
                top: clamp(toNumber(q.bbox.top, 0), 0, 1),
                width: clamp(toNumber(q.bbox.width, 0.05), 0.001, 1),
                height: clamp(toNumber(q.bbox.height, 0.05), 0.001, 1),
              }
            : null;

          return {
            questionNumber: toNumber(q.questionNumber, index + 1),
            question: String(q.question ?? ''),
            page: Math.max(1, Math.min(9999, toNumber(q.page, 1))),
            studentAnswer: String(q.studentAnswer ?? ''),
            status: validStatus,
            bbox,
            correctedAnswer: String(q.correctedAnswer ?? ''),
            whyWrong: String(q.whyWrong ?? ''),
            missingPoints: Array.isArray(q.missingPoints)
              ? q.missingPoints.map((p) => String(p)).filter(Boolean).slice(0, 3)
              : [],
            suggestion: String(q.suggestion ?? ''),
            teacherComment: String(q.teacherComment ?? ''),
            teacherNote: String(q.teacherNote ?? ''),
            markups: normalizeAnnotations(validStatus, q.markups),
            obtainedMarks,
            maxMarks,
            confidence: clamp(toNumber(q.confidence, 1), 0, 1),
          };
        })
    : [];

  const topicsToImprove = Array.isArray(raw.topicsToImprove)
    ? raw.topicsToImprove.map((t) => String(t)).filter(Boolean).slice(0, 8)
    : [];

  return {
    questions,
    obtainedMarks: toNumber(raw.obtainedMarks, 0),
    totalMarks: toNumber(raw.totalMarks, 0),
    teacherFeedback: String(raw.teacherFeedback ?? ''),
    topicsToImprove,
  };
}

module.exports = { evaluateAnswerSheet, extractJson, normalizeResult, MAX_PAGES_PER_REQUEST };