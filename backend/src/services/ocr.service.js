const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const { createWorker } = require('tesseract.js');
const { GOOGLE_API_KEY } = require('../config/env');
const logger = require('../utils/logger');

const TESSDATA_DIR = path.resolve(process.cwd(), 'data/tessdata');

/**
 * Normalizes any uploaded image buffer to a JPEG blob accepted by Google
 * Vision OCR (accepts PNG/JPEG/WebP/HEIC/HEIF).
 */
async function toJpegBuffer(buffer, mimetype) {
  const sharp = require('sharp');
  const png = await sharp(buffer, { failOn: 'none' }).rotate().jpeg({ quality: 92 }).toBuffer();
  return png;
}

/**
 * Google Vision document_text_detection OCR (used when GOOGLE_API_KEY is set).
 * Returns { text, blocks, confidence }. Blocks carry word-level boxes in
 * normalized coordinates (0-1) used for question-region mapping.
 */
async function googleVisionOcr(imageBuffer) {
  const jpeg = await toJpegBuffer(imageBuffer);
  const body = {
    requests: [
      {
        image: { content: jpeg.toString('base64') },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
      },
    ],
  };
  const { data } = await axios.post(
    'https://vision.googleapis.com/v1/images:annotate',
    body,
    { params: { key: GOOGLE_API_KEY }, timeout: 30000 }
  );
  const response = data?.responses?.[0];
  if (response?.error) {
    throw new Error(`Google Vision error: ${response.error.message}`);
  }
  const fullText = response?.fullTextAnnotation;
  if (!fullText) {
    return { text: '', confidence: 0, blocks: [] };
  }

  const blocks = [];
  for (const page of fullText.pages || []) {
    for (const block of page.blocks || []) {
      const vertices = block.boundingBox?.vertices || [];
      const xs = vertices.map((v) => v.x ?? 0);
      const ys = vertices.map((v) => v.y ?? 0);
      const width = fullText.width || 1;
      const height = fullText.height || 1;
      blocks.push({
        left: Math.min(...xs) / width,
        top: Math.min(...ys) / height,
        right: Math.max(...xs) / width,
        bottom: Math.max(...ys) / height,
        text: block.text || '',
      });
    }
  }

  return {
    text: fullText.text || '',
    confidence: blocks.length > 0 ? 1 : 0,
    blocks,
  };
}

let tesseractWorker = null;

async function getTesseractWorker() {
  if (tesseractWorker) return tesseractWorker;
  // Pre-download the traineddata so the engine works offline afterwards.
  const trainedData = path.join(TESSDATA_DIR, 'eng.traineddata.gz');
  if (!fs.existsSync(trainedData)) {
    try {
      fs.mkdirSync(TESSDATA_DIR, { recursive: true });
      logger.info('Downloading Tesseract English traineddata…');
      const { data } = await axios.get(
        'https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz',
        { responseType: 'arraybuffer', timeout: 120000 }
      );
      fs.writeFileSync(trainedData, Buffer.from(data));
      logger.info('Tesseract traineddata ready.');
    } catch (err) {
      logger.warn(`Could not pre-download traineddata (${err.message}); tesseract.js will fetch on first use.`);
    }
  }

  tesseractWorker = await createWorker('eng', 1, {
    langPath: TESSDATA_DIR,
    logger: (message) => {
      if (message.status === 'recognizing text') {
        logger.debug(`Tesseract OCR ${Math.round(message.progress * 100)}%`);
      }
    },
  });
  return tesseractWorker;
}

async function resetTesseractWorker() {
  if (tesseractWorker) {
    try {
      await tesseractWorker.terminate();
    } catch (err) {
      logger.warn(`Tesseract worker terminate failed: ${err.message}`);
    }
    tesseractWorker = null;
  }
}

/**
 * Tesseract OCR — the local, real OCR engine (fallback when Google Vision is
 * not configured). Returns text plus word-level boxes so question regions can
 * be mapped to normalized coordinates.
 */
async function tesseractOcr(imageBuffer) {
  const sharp = require('sharp');
  // Tesseract prefers larger, grayscale input for handwriting accuracy.
  const prepared = await sharp(imageBuffer, { failOn: 'none' })
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .grayscale()
    .png()
    .toBuffer();

  const worker = await getTesseractWorker();
  const { data } = await worker.recognize(prepared);

  const words = (data.words || []).map((word) => ({
    text: word.text || '',
    confidence: word.confidence ?? 0,
    left: word.bbox?.x0 ?? 0,
    top: word.bbox?.y0 ?? 0,
    right: word.bbox?.x1 ?? 0,
    bottom: word.bbox?.y1 ?? 0,
  }));

  return {
    text: data.text || '',
    confidence: data.confidence ?? 0,
    words,
    width: data.width ?? 0,
    height: data.height ?? 0,
  };
}

/**
 * Reads handwritten/typed text from an image using REAL OCR.
 * Google Vision is preferred when GOOGLE_API_KEY is configured; otherwise the
 * local Tesseract engine is used. Never simulated — an error is thrown when
 * the text cannot be read.
 */
async function ocrImage(imageBuffer) {
  if (GOOGLE_API_KEY) {
    try {
      logger.info('Using Google Vision OCR.');
      return await googleVisionOcr(imageBuffer);
    } catch (err) {
      logger.warn(`Google Vision failed (${err.message}); falling back to Tesseract.`);
    }
  }
  logger.info('Using Tesseract OCR.');
  try {
    return await tesseractOcr(imageBuffer);
  } catch (err) {
    logger.error(`Tesseract OCR failed: ${err.message}`);
    const error = new Error('OCR failed — the handwriting could not be read. Try a clearer, higher-contrast scan.');
    error.status = 422;
    error.isOperational = true;
    throw error;
  }
}

module.exports = { ocrImage, resetTesseractWorker, TESSDATA_DIR };
