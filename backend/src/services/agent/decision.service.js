const { GOOGLE_API_KEY } = require('../../config/env');

/**
 * Deterministic decision rules. Every decision the agent makes is derived
 * from a real observation or verification result — nothing random, nothing
 * fabricated.
 */

// Hard bounds — no infinite loops, no runaway API cost.
const MAX_OCR_STRATEGIES_PER_PAGE = 3;
const MAX_QUESTION_RECHECKS = 5;

const QUESTION_AUTO_CONFIDENCE = 0.7; // >= → auto-evaluated
const QUESTION_RECHECK_CONFIDENCE = 0.4; // >= → one more focused analysis; below → teacher review

/**
 * Preprocessing decision from the page-quality observation. Good pages are
 * OCR'd directly; flagged pages are enhanced first.
 */
function decidePreprocessing(observation = {}) {
  const issues = observation.issues || [];
  const reasons = [];
  if (issues.includes('low_contrast')) reasons.push('low contrast');
  if (issues.includes('possible_blur')) reasons.push('possible blur');
  if (issues.includes('too_dark')) reasons.push('underexposed image');
  if (issues.includes('too_bright')) reasons.push('overexposed image');
  if (issues.includes('low_resolution')) reasons.push('low resolution');

  return {
    enhance: reasons.length > 0,
    reasons,
    message: reasons.length > 0
      ? `Image enhancement selected before OCR (${reasons.join(', ')}).`
      : 'Image quality is good enough — OCR directly without preprocessing.',
  };
}

/**
 * Bounded, provider-aware OCR strategy plan. The first strategy is the
 * existing default chain; later ones only run when an earlier attempt fails
 * verification. Only strategies backed by existing services are planned.
 */
function planOcrStrategies() {
  const strategies = [
    { name: 'default_ocr', provider: 'auto', enhanced: false },
    { name: 'enhanced_ocr', provider: 'auto', enhanced: true },
  ];
  strategies.push(
    GOOGLE_API_KEY
      ? { name: 'tesseract_enhanced_ocr', provider: 'tesseract', enhanced: true }
      : { name: 'google_vision_enhanced_ocr', provider: 'google_vision', enhanced: true }
  );
  return strategies.slice(0, MAX_OCR_STRATEGIES_PER_PAGE);
}

/**
 * Question-level outcome classification from the real evaluation result.
 * Uncertain questions are NEVER auto-graded silently — they get one bounded
 * additional analysis, then teacher review.
 */
function classifyQuestion(question = {}) {
  const confidence = Number(question.confidence);
  const answer = String(question.studentAnswer || '').trim();
  const hasReadableAnswer = answer.length > 0 || question.status === 'unattempted';

  if (!hasReadableAnswer) {
    return { outcome: 'NEEDS_TEACHER_REVIEW', reason: 'The answer could not be reliably read from the sheet.' };
  }
  if (!Number.isFinite(confidence)) {
    return { outcome: 'NEEDS_ADDITIONAL_ANALYSIS', reason: 'The evaluation did not report a confidence value.' };
  }
  if (confidence >= QUESTION_AUTO_CONFIDENCE) {
    return { outcome: 'AUTO_EVALUATED', reason: `Evaluation confidence ${Math.round(confidence * 100)}% is high.` };
  }
  if (confidence >= QUESTION_RECHECK_CONFIDENCE) {
    return {
      outcome: 'NEEDS_ADDITIONAL_ANALYSIS',
      reason: `Evaluation confidence ${Math.round(confidence * 100)}% is middling — one more focused analysis is allowed.`,
    };
  }
  return {
    outcome: 'NEEDS_TEACHER_REVIEW',
    reason: `Evaluation confidence ${Math.round(confidence * 100)}% is too low to grade automatically.`,
  };
}

function shouldRecheckQuestion(classification) {
  return classification.outcome === 'NEEDS_ADDITIONAL_ANALYSIS';
}

/**
 * Adopts a focused re-analysis only when it is strictly better supported
 * (higher confidence). Keeps the original page attribution.
 */
function adoptReanalysis(original, reanalyzed) {
  if (!reanalyzed || Number(reanalyzed.confidence) <= Number(original.confidence)) return null;
  return {
    ...original,
    question: reanalyzed.question ?? original.question,
    studentAnswer: reanalyzed.studentAnswer ?? original.studentAnswer,
    status: reanalyzed.status ?? original.status,
    bbox: reanalyzed.bbox ?? original.bbox,
    correctedAnswer: reanalyzed.correctedAnswer ?? original.correctedAnswer,
    whyWrong: reanalyzed.whyWrong ?? original.whyWrong,
    missingPoints: Array.isArray(reanalyzed.missingPoints) ? reanalyzed.missingPoints : original.missingPoints,
    suggestion: reanalyzed.suggestion ?? original.suggestion,
    teacherComment: reanalyzed.teacherComment ?? original.teacherComment,
    teacherNote: reanalyzed.teacherNote ?? original.teacherNote,
    markups: Array.isArray(reanalyzed.markups) ? reanalyzed.markups : original.markups,
    obtainedMarks: Number.isFinite(Number(reanalyzed.obtainedMarks)) ? Number(reanalyzed.obtainedMarks) : original.obtainedMarks,
    maxMarks: Number.isFinite(Number(reanalyzed.maxMarks)) && Number(reanalyzed.maxMarks) > 0 ? Number(reanalyzed.maxMarks) : original.maxMarks,
    confidence: Number(reanalyzed.confidence),
  };
}

module.exports = {
  MAX_OCR_STRATEGIES_PER_PAGE,
  MAX_QUESTION_RECHECKS,
  QUESTION_AUTO_CONFIDENCE,
  QUESTION_RECHECK_CONFIDENCE,
  decidePreprocessing,
  planOcrStrategies,
  classifyQuestion,
  shouldRecheckQuestion,
  adoptReanalysis,
};