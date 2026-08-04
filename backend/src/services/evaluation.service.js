const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const { ocrImage, resetTesseractWorker } = require('./ocr.service');
const { evaluateAnswerSheet } = require('./gemini-evaluate.service');
const { annotatePages } = require('./annotation.service');
const storage = require('./storage.service');
const logger = require('../utils/logger');

const ACCEPTED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']);

/**
 * Retries an async task with exponential backoff. Used for transient failures
 * in the evaluation pipeline (Gemini 5xx / network). Never retries 4xx.
 */
async function withRetry(task, { attempts = 3, baseDelayMs = 1000, label = 'task' } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      const retryable = !err.status || err.status >= 500;
      if (!retryable || attempt === attempts) throw err;
      const delay = baseDelayMs * 2 ** (attempt - 1);
      logger.warn(`${label} attempt ${attempt}/${attempts} failed (${err.message}); retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function normalizePageImage(buffer, mimetype, index) {
  if (!ACCEPTED_IMAGE_MIME.has(mimetype)) {
    const error = new Error(`Unsupported page ${index + 1} type "${mimetype}". Only JPG, PNG, WEBP and HEIC are supported.`);
    error.status = 400;
    error.isOperational = true;
    throw error;
  }
  // Normalize to a predictable PNG, auto-rotate by EXIF, cap dimensions.
  // HEIC/HEIF are decoded by libvips here, so the rest of the pipeline only
  // ever works with PNG buffers.
  return sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: 1800, withoutEnlargement: true })
    .png()
    .toBuffer();
}

/**
 * Compiles the corrected (annotated) pages into one PDF, like handing back a
 * marked notebook. Original uploads are never touched.
 */
async function buildCorrectedPdf({ pageBuffers }) {
  const doc = new PDFDocument({ autoFirstPage: false, size: 'A4' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  for (let i = 0; i < pageBuffers.length; i++) {
    const buffer = pageBuffers[i];
    const meta = await sharp(buffer, { failOn: 'none' }).metadata();
    const w = meta.width || 1240;
    const h = meta.height || 1754;
    const landscape = w > h;
    doc.addPage({ size: landscape ? [w, h] : [w, h], layout: landscape ? 'landscape' : 'portrait', margin: 0 });
    doc.image(buffer, 0, 0, { width: w, height: h });
  }

  doc.end();
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

/**
 * Runs the full real evaluation pipeline:
 *   1. normalize uploaded page images (HEIC included)
 *   2. real OCR on every page (Google Vision if key present, else Tesseract)
 *   3. Gemini Vision reads handwriting + evaluates with its own knowledge
 *   4. draw teacher annotations (ticks, crosses, circles, notes) on the pages
 *   5. compile corrected PDF, persist originals + corrected images + JSON
 */
async function runEvaluation({ evaluationId, sheetPages, config, onStage }) {
  const startedAt = Date.now();
  const { subject = 'General' } = config;

  onStage?.('preparing', 8, 'Preparing images');

  const normalized = [];
  for (let i = 0; i < sheetPages.length; i++) {
    const p = sheetPages[i];
    const buffer = await normalizePageImage(p.buffer, p.mimetype, i);
    normalized.push({ buffer, mimetype: 'image/png' });
  }

  const pageCount = normalized.length;

  // ---- 1. REAL OCR ----
  onStage?.('ocr', 18, pageCount > 1 ? `Reading handwriting on ${pageCount} pages` : 'Reading handwriting on the sheet');
  const ocrResults = [];
  for (let i = 0; i < normalized.length; i++) {
    onStage?.('ocr', 18 + Math.round((14 * (i + 1)) / normalized.length), `Reading page ${i + 1} of ${pageCount}`);
    ocrResults.push(await ocrImage(normalized[i].buffer));
  }
  const ocrTexts = ocrResults.map((r) => ({ text: r.text || '', confidence: r.confidence || 0 }));

  const noTextPages = ocrTexts.filter((t) => !t.text.trim()).length;
  if (noTextPages === ocrTexts.length) {
    const error = new Error('No handwriting could be read on any page. Try a clearer, higher-contrast scan.');
    error.status = 422;
    error.isOperational = true;
    throw error;
  }

  // ---- 2. GEMINI VISION + EVALUATION (no answer key — own knowledge) ----
  onStage?.('sending', 45, 'Sending pages to Gemini');

  const geminiInput = normalized.map((p) => ({ buffer: p.buffer, mimeType: p.mimetype }));

  let evaluation;
  try {
    evaluation = await withRetry(
      () =>
        evaluateAnswerSheet({
          sheetPages: geminiInput,
          subject,
          onStage,
        }),
      { attempts: 2, baseDelayMs: 1500, label: 'Gemini evaluation' }
    );
  } catch (err) {
    if (err.status !== 503) {
      logger.error(`Gemini evaluation failed: ${err.message}`);
    }
    throw err;
  }

  // ---- 3. ANNOTATE THE REAL SHEETS (teacher pen) ----
  onStage?.('annotating', 86, 'Marking corrections on the sheets');
  const annotated = await annotatePages({
    pageBuffers: normalized.map((p) => p.buffer),
    questions: evaluation.questions,
    mimeTypes: normalized.map((p) => p.mimetype),
  });

  // ---- 4. STORE FILES (originals are never overwritten) ----
  onStage?.('report', 94, 'Preparing corrected sheets');
  const dir = storage.ensureEvaluationDir(evaluationId);

  const pages = [];
  for (let i = 0; i < normalized.length; i++) {
    const originalName = `page-${i + 1}-original.png`;
    const annotatedName = `page-${i + 1}-annotated.png`;
    fs.writeFileSync(path.join(dir, originalName), normalized[i].buffer);
    fs.writeFileSync(path.join(dir, annotatedName), annotated[i].buffer);
    pages.push({
      pageNumber: i + 1,
      originalUrl: storage.toPublicUrl(path.join(dir, originalName)),
      annotatedUrl: storage.toPublicUrl(path.join(dir, annotatedName)),
      ocrText: ocrTexts[i].text,
    });
  }

  const record = {
    evaluationId,
    subject,
    questions: evaluation.questions,
    teacherFeedback: evaluation.teacherFeedback,
    topicsToImprove: evaluation.topicsToImprove,
    pages,
    status: 'completed',
    elapsedMs: Date.now() - startedAt,
    createdAt: new Date().toISOString(),
  };

  const correctedPdf = await buildCorrectedPdf({ pageBuffers: annotated.map((a) => a.buffer) });
  const pdfName = 'corrected-sheets.pdf';
  fs.writeFileSync(path.join(dir, pdfName), correctedPdf);
  record.correctedPdfUrl = storage.toPublicUrl(path.join(dir, pdfName));

  await storage.saveEvaluation(record);

  onStage?.('completed', 100, 'Evaluation complete');

  // Free Tesseract resources between evaluations.
  resetTesseractWorker().catch(() => {});

  return record;
}

module.exports = { runEvaluation, withRetry };