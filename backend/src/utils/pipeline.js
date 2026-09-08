const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const logger = require('./logger');

const ACCEPTED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']);

/**
 * Shared evaluation-pipeline helpers. Kept separate from
 * services/evaluation.service.js so the agentic controller and the public
 * entry point can both use them without importing each other.
 */

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

module.exports = { withRetry, normalizePageImage, buildCorrectedPdf };