const sharp = require('sharp');
const { GOOGLE_API_KEY } = require('../../config/env');
const ocrService = require('../ocr.service');
const { normalizePageImage } = require('../../utils/pipeline');
const logger = require('../../utils/logger');

/**
 * Thin tool wrappers around the existing services. The agent orchestrates —
 * every real capability still lives in its original service module. These
 * wrappers only normalize calls and results for the decision/verification
 * layers.
 */

/**
 * Normalizes one uploaded page using the shared pipeline helper (EXIF
 * rotation, size cap, PNG — HEIC included).
 */
async function preparePage({ buffer, mimetype, index }) {
  const normalized = await normalizePageImage(buffer, mimetype, index);
  return { buffer: normalized, mimetype: 'image/png' };
}

/**
 * Grayscale contrast stretch + sharpening for a page retry. Only used when
 * the observation/verification steps flagged the page — never unconditionally.
 */
async function enhancePageImage(buffer) {
  return sharp(buffer, { failOn: 'none' })
    .grayscale()
    .normalize()
    .sharpen({ sigma: 1 })
    .png()
    .toBuffer();
}

/**
 * Runs one bounded OCR strategy with the existing OCR service and normalizes
 * the provider-specific result shape into what the verifier understands.
 * Confidence is never invented: Tesseract reports a real 0-100 score
 * (normalized to 0-1), Google Vision only reports a 0/1 "text found" flag.
 */
async function runOcrStrategy(strategy, imageBuffer) {
  const input = strategy.enhanced ? await enhancePageImage(imageBuffer) : imageBuffer;
  let raw;
  if (strategy.provider === 'google_vision') {
    raw = await ocrService.googleVisionOcr(input);
  } else if (strategy.provider === 'tesseract') {
    raw = await ocrService.tesseractOcr(input);
  } else {
    // Existing default chain: Google Vision when configured, Tesseract otherwise.
    raw = await ocrService.ocrImage(input);
  }

  const text = String(raw?.text || '');
  const rawConfidence = Number(raw?.confidence ?? 0) || 0;
  if (Array.isArray(raw?.words)) {
    return {
      text,
      confidence: rawConfidence > 1 ? rawConfidence / 100 : rawConfidence,
      confidenceScale: 'continuous',
      wordCount: (raw.words || []).length,
    };
  }
  if (Array.isArray(raw?.blocks)) {
    return { text, confidence: rawConfidence, confidenceScale: 'binary', wordCount: 0 };
  }
  return {
    text,
    confidence: rawConfidence > 1 ? rawConfidence / 100 : rawConfidence,
    confidenceScale: null,
    wordCount: 0,
  };
}

function describeStrategy(strategy) {
  const provider = strategy.provider === 'auto' ? 'the default OCR provider chain' : strategy.provider;
  return strategy.enhanced ? `an enhanced image + ${provider}` : provider;
}

module.exports = {
  preparePage,
  enhancePageImage,
  runOcrStrategy,
  describeStrategy,
  hasGoogleVision: Boolean(GOOGLE_API_KEY),
};