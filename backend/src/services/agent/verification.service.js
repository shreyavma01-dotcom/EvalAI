/**
 * Deterministic verification of every major action result. The agent only
 * adapts when one of these checks says the result is not good enough —
 * never on a hunch.
 */
const MIN_TEXT_CHARS = 12;
const MIN_MEANINGFUL_WORDS = 3;
const OCR_CONFIDENCE_THRESHOLD = 0.55; // normalized (0-1) Tesseract confidence

/**
 * OCR verification. When a real confidence value exists (Tesseract) the
 * threshold applies; when only a presence flag exists (Google Vision) the
 * text metrics decide on their own.
 */
function verifyOcrResult(result = {}) {
  const text = String(result.text || '').trim();
  const words = text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));
  const metrics = {
    chars: text.length,
    words: words.length,
    confidence: result.confidence ?? null,
    confidenceScale: result.confidenceScale ?? null,
  };

  if (!text) {
    return { status: 'insufficient', reason: 'No usable text was detected.', metrics };
  }
  if (text.length < MIN_TEXT_CHARS || words.length < MIN_MEANINGFUL_WORDS) {
    return { status: 'insufficient', reason: 'Extracted text is too short to be meaningful.', metrics };
  }
  if (result.confidenceScale === 'continuous' && Number(result.confidence) < OCR_CONFIDENCE_THRESHOLD) {
    return {
      status: 'weak',
      reason: `OCR confidence ${Math.round(Number(result.confidence) * 100)}% is below the ${OCR_CONFIDENCE_THRESHOLD * 100}% threshold.`,
      metrics,
    };
  }
  return { status: 'sufficient', reason: 'Text extracted and passes the quality checks.', metrics };
}

const VERDICT_RANK = { insufficient: 0, weak: 1, sufficient: 2 };

/** Keeps the best OCR attempt across bounded strategies (no confidence inventing). */
function isBetterOcr(candidate, incumbent) {
  if (!incumbent) return true;
  if (VERDICT_RANK[candidate.verdict.status] !== VERDICT_RANK[incumbent.verdict.status]) {
    return VERDICT_RANK[candidate.verdict.status] > VERDICT_RANK[incumbent.verdict.status];
  }
  return candidate.result.text.trim().length > incumbent.result.text.trim().length;
}

/**
 * Evaluation verification: did Gemini return structured, complete and
 * in-range output for this sheet?
 */
function verifyEvaluation(evaluation = {}, pageCount = 0) {
  const issues = [];
  const questions = Array.isArray(evaluation.questions) ? evaluation.questions : [];

  if (questions.length === 0) {
    issues.push('No questions were detected in the evaluation output.');
  }
  for (const q of questions) {
    const num = q?.questionNumber ?? '?';
    const page = Number(q?.page);
    if (!Number.isFinite(page) || page < 1 || page > Math.max(pageCount, 1)) {
      issues.push(`Question ${num} references page ${q?.page}, which is outside the sheet.`);
    }
    const obtained = Number(q?.obtainedMarks);
    const max = Number(q?.maxMarks);
    if (!Number.isFinite(obtained) || obtained < 0) issues.push(`Question ${num} has invalid obtained marks.`);
    if (!Number.isFinite(max) || max < 0) issues.push(`Question ${num} has invalid max marks.`);
    if (Number.isFinite(obtained) && Number.isFinite(max) && obtained > max) {
      issues.push(`Question ${num} was awarded more marks than its maximum.`);
    }
    if (!['correct', 'partial', 'incorrect', 'unattempted'].includes(q?.status)) {
      issues.push(`Question ${num} has an unrecognized status "${q?.status}".`);
    }
  }

  return {
    status: issues.length === 0 ? 'valid' : 'invalid',
    reason:
      issues.length === 0
        ? `Structured evaluation passed all validity checks for ${questions.length} question(s).`
        : issues.slice(0, 3).join(' '),
    issues,
    questionCount: questions.length,
  };
}

/**
 * Annotation verification: one rendered overlay per page, buffers intact.
 */
async function verifyAnnotations(annotatedPages = [], pageCount = 0) {
  const problems = [];
  if (!Array.isArray(annotatedPages) || annotatedPages.length !== pageCount) {
    problems.push('Annotated page count does not match the sheet.');
  }
  for (let i = 0; i < (annotatedPages || []).length; i++) {
    if (!annotatedPages[i]?.buffer || annotatedPages[i].buffer.length === 0) {
      problems.push(`Page ${i + 1} annotation output is missing.`);
    }
  }
  return {
    status: problems.length === 0 ? 'valid' : 'invalid',
    reason:
      problems.length === 0
        ? 'Every page received a rendered annotation overlay.'
        : problems.slice(0, 3).join(' '),
  };
}

module.exports = {
  verifyOcrResult,
  isBetterOcr,
  verifyEvaluation,
  verifyAnnotations,
  OCR_CONFIDENCE_THRESHOLD,
};