const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../config/env');
const storage = require('../services/storage.service');

const SUBMISSIONS_DIR = path.resolve(process.cwd(), UPLOAD_DIR, 'submissions');

function submissionDir(submissionId) {
  return path.join(SUBMISSIONS_DIR, submissionId);
}

function ensureSubmissionDir(submissionId) {
  const dir = submissionDir(submissionId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function fileUrlFor(submissionId, filename) {
  const absolute = path.join(submissionDir(submissionId), filename);
  return storage.toPublicUrl(absolute);
}

/**
 * Persists uploaded files (multer memory buffers) for a submission and
 * returns the file descriptors used by the Submission model.
 */
function saveUploadedFiles({ files, submissionId, prefix }) {
  const dir = ensureSubmissionDir(submissionId);
  const saved = [];
  for (let i = 0; i < (files || []).length; i++) {
    const file = files[i];
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const ext = path.extname(safeName) || '.bin';
    const filename = `${prefix}-${i + 1}${ext}`;
    fs.writeFileSync(path.join(dir, filename), file.buffer);
    saved.push({
      fileUrl: fileUrlFor(submissionId, filename),
      originalName: safeName || filename,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size || file.buffer.length,
    });
  }
  return saved;
}

module.exports = { saveUploadedFiles, submissionDir, ensureSubmissionDir };
