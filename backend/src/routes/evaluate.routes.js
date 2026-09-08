const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { getIO } = require('../sockets');
const { runEvaluation } = require('../services/evaluation.service');
const storage = require('../services/storage.service');
const { MAX_FILE_SIZE, MAX_SHEETS_PER_EVALUATION } = require('../config/env');
const logger = require('../utils/logger');

const ALLOWED_MIME = new Map([
  ['image/png', true],
  ['image/jpeg', true],
  ['image/jpg', true],
  ['image/webp', true],
  ['image/heic', true],
  ['image/heif', true],
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    const error = new Error('Unsupported file type. Only JPG, PNG, JPEG, WEBP and HEIC images are supported.');
    error.status = 400;
    error.isOperational = true;
    return cb(error);
  },
});

const router = Router();

function emit(evaluationId, stage, percent, message) {
  if (!evaluationId) return;
  try {
    getIO()?.to(`evaluation:${evaluationId}`).emit('evaluation:progress', {
      evaluationId,
      stage,
      percent,
      message,
      timestamp: Date.now(),
    });
  } catch (err) {
    logger.warn(`Socket progress emit failed: ${err.message}`);
  }
}

/**
 * Structured agent trace events (goal / observed / decided / acted /
 * verified / adapted / escalated / completed) for the Agent Activity
 * Timeline. Only events for things that actually happened are emitted.
 */
function emitAgentEvent(evaluationId, event) {
  if (!evaluationId || !event) return;
  try {
    getIO()?.to(`evaluation:${evaluationId}`).emit('agent:trace', {
      evaluationId,
      type: event.type,
      step: event.step,
      title: event.title,
      message: event.message,
      metadata: event.metadata,
      timestamp: event.timestamp,
    });
  } catch (err) {
    logger.warn(`Agent trace emit failed: ${err.message}`);
  }
}

/**
 * POST /api/evaluation/evaluate
 * Real end-to-end evaluation using ONLY the uploaded handwritten pages.
 * Gemini Vision reads the handwriting and grades from its own knowledge.
 * There is no answer key, no marking scheme and no expected answers.
 */
router.post(
  '/evaluate',
  upload.fields([{ name: 'answerSheets', maxCount: MAX_SHEETS_PER_EVALUATION }]),
  async (req, res, next) => {
    try {
      const sheetPages = req.files?.answerSheets || [];

      if (sheetPages.length === 0) {
        return res.status(400).json({ success: false, message: 'Please upload one or more handwritten page images.' });
      }
      if (sheetPages.length > MAX_SHEETS_PER_EVALUATION) {
        return res.status(400).json({ success: false, message: `A maximum of ${MAX_SHEETS_PER_EVALUATION} pages per evaluation is supported.` });
      }

      const evaluationId = String(req.body?.evaluationId || 'eval_' + Date.now().toString(36));
      const config = {
        subject: String(req.body?.subject || 'General'),
      };

      const startedAt = Date.now();
      emit(evaluationId, 'uploading', 4, 'Uploading pages');
      emit(evaluationId, 'preparing', 8, 'Preparing images');

      const result = await runEvaluation({
        evaluationId,
        sheetPages: sheetPages.map((f) => ({ buffer: f.buffer, mimetype: f.mimetype })),
        config,
        onStage: (stage, percent, message) => emit(evaluationId, stage, percent, message),
        onAgentEvent: (event) => emitAgentEvent(evaluationId, event),
      });

      result.elapsedMs = Date.now() - startedAt;
      emit(evaluationId, 'completed', 100, 'Evaluation complete');

      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * GET /api/evaluation/:id/download/page/:page
 * Serves a single stored page as PNG or JPG. role = original | annotated
 * (default annotated). Original uploads are stored separately and never
 * overwritten.
 */
router.get('/:id/download/page/:page', async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, Math.min(9999, Number(req.params.page) || 1));
    const role = req.query.role === 'original' ? 'original' : 'annotated';
    const format = req.query.format === 'jpg' ? 'jpg' : req.query.format === 'jpeg' ? 'jpeg' : 'png';

    const filename = `page-${page}-${role}.png`;
    const full = storage.filePathFor(id, filename);
    if (!fs.existsSync(full)) {
      return res.status(404).json({ success: false, message: 'Page not found for this evaluation.' });
    }

    let buffer = fs.readFileSync(full);
    if (format !== 'png') {
      buffer = await sharp(buffer, { failOn: 'none' }).jpeg({ quality: 92 }).toBuffer();
    }
    const contentType = format === 'png' ? 'image/png' : 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `attachment; filename="${filename.replace('.png', `.${format}`)}"`);
    return res.send(buffer);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/evaluation/:id/download/corrected.pdf
 * The full corrected answer sheet — every annotated page compiled into one PDF.
 */
router.get('/:id/download/corrected.pdf', async (req, res, next) => {
  try {
    const { id } = req.params;
    const filename = 'corrected-sheets.pdf';
    const full = storage.filePathFor(id, filename);
    if (!fs.existsSync(full)) {
      return res.status(404).json({ success: false, message: 'Corrected sheet not found for this evaluation.' });
    }
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(full);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/evaluation/history — saved evaluations, newest first.
 */
router.get('/history', async (_req, res, next) => {
  try {
    const items = await storage.listEvaluations(50);
    return res.json({ success: true, data: items });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/evaluation/:id — a saved evaluation result.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const record = await storage.getEvaluation(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Evaluation not found.' });
    }
    return res.json({ success: true, data: record });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;