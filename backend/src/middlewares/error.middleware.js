const logger = require('../utils/logger');

function notFound(_req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  logger.error(`API Error: ${err.message}`, { stack: err.stack });

  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum allowed size is 15MB.'
        : err.code === 'LIMIT_FILE_COUNT'
          ? 'Too many files uploaded.'
          : `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, message });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(', '),
    });
  }

  const status = err.status || err.statusCode || 500;
  // Surface actionable messages for our own pipeline errors (Gemini key
  // missing 503, OCR/read failure 422, Gemini unreachable 502, upload 400).
  // 4xx messages are always surfaced; 5xx only when marked operational so
  // unexpected internal failures stay generic.
  const message = status < 500 || err.isOperational ? err.message : 'Internal server error';
  res.status(status).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { notFound, errorHandler };
