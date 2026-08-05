const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../config/env');
const storage = require('../services/storage.service');

const SUBMISSIONS_DIR = path.resolve(process.cwd(), UPLOAD_DIR, 'submissions');

/**
 * Writes a generated PDF report into the submission's folder and returns its
 * public URL.
 */
async function reportUrlForSubmission({ submissionId, buffer }) {
  const dir = path.join(SUBMISSIONS_DIR, submissionId);
  fs.mkdirSync(dir, { recursive: true });
  const filename = 'report.pdf';
  fs.writeFileSync(path.join(dir, filename), buffer);
  const absolute = path.join(dir, filename);
  return storage.toPublicUrl(absolute);
}

module.exports = { reportUrlForSubmission };