const fs = require('fs');
const path = require('path');
const { isMongoConnected } = require('../config/db');
const { UPLOAD_DIR } = require('../config/env');
const Evaluation = require('../models/evaluation.model');
const logger = require('../utils/logger');

const EVALUATIONS_DIR = path.resolve(process.cwd(), UPLOAD_DIR, 'evaluations');

function evaluationDir(evaluationId) {
  return path.join(EVALUATIONS_DIR, evaluationId);
}

function filePathFor(evaluationId, filename) {
  return path.join(evaluationDir(evaluationId), filename);
}

function toPublicUrl(absolutePath) {
  const relative = path.relative(path.resolve(process.cwd(), UPLOAD_DIR), absolutePath).split(path.sep).join('/');
  return `/uploads/${relative}`;
}

function ensureEvaluationDir(evaluationId) {
  const dir = evaluationDir(evaluationId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Persists the full evaluation record. Prefers MongoDB when connected;
 * otherwise falls back to a JSON file under uploads/evaluations/<id>/result.json
 * so evaluation history survives restarts in both modes.
 */
async function saveEvaluation(record) {
  ensureEvaluationDir(record.evaluationId);

  const jsonPath = filePathFor(record.evaluationId, 'result.json');
  fs.writeFileSync(jsonPath, JSON.stringify(record, null, 2), 'utf8');

  if (isMongoConnected()) {
    try {
      await Evaluation.findOneAndUpdate({ evaluationId: record.evaluationId }, record, { upsert: true, returnDocument: 'after' });
      return;
    } catch (err) {
      logger.warn(`Mongo save failed, kept file fallback: ${err.message}`);
    }
  }
}

async function getEvaluation(evaluationId) {
  if (isMongoConnected()) {
    try {
      const found = await Evaluation.findOne({ evaluationId });
      if (found) return found.toObject();
    } catch (err) {
      logger.warn(`Mongo read failed: ${err.message}`);
    }
  }
  const jsonPath = filePathFor(evaluationId, 'result.json');
  if (!fs.existsSync(jsonPath)) return null;
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

/**
 * Lists saved evaluations, newest first.
 */
async function listEvaluations(limit = 50) {
  if (isMongoConnected()) {
    try {
      const found = await Evaluation.find().sort({ createdAt: -1 }).limit(limit).lean();
      if (found.length > 0) {
        return found.map((e) => ({
          evaluationId: e.evaluationId,
          studentName: e.studentName,
          rollNumber: e.rollNumber,
          subject: e.subject,
          obtainedMarks: e.obtainedMarks,
          totalMarks: e.totalMarks,
          percentage: e.percentage,
          grade: e.grade,
          passed: e.passed,
          status: e.status,
          createdAt: e.createdAt,
          questionCount: (e.questions || []).length,
        }));
      }
    } catch (err) {
      logger.warn(`Mongo list failed: ${err.message}`);
    }
  }

  if (!fs.existsSync(EVALUATIONS_DIR)) return [];
  const dirs = fs.readdirSync(EVALUATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const items = [];
  for (const id of dirs) {
    const jsonPath = path.join(EVALUATIONS_DIR, id, 'result.json');
    if (!fs.existsSync(jsonPath)) continue;
    try {
      const e = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      items.push({
        evaluationId: e.evaluationId,
        studentName: e.studentName,
        rollNumber: e.rollNumber,
        subject: e.subject,
        obtainedMarks: e.obtainedMarks,
        totalMarks: e.totalMarks,
        percentage: e.percentage,
        grade: e.grade,
        passed: e.passed,
        status: e.status,
        createdAt: e.createdAt,
        questionCount: (e.questions || []).length,
      });
    } catch (err) {
      logger.warn(`Skipping unreadable evaluation ${id}: ${err.message}`);
    }
  }
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
}

module.exports = {
  saveEvaluation,
  getEvaluation,
  listEvaluations,
  evaluationDir,
  filePathFor,
  ensureEvaluationDir,
  toPublicUrl,
};
