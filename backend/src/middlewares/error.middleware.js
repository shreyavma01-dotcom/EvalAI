const logger = require('../utils/logger');

/**
 * Wraps an async route/controller handler so thrown errors reach the
 * central error handler.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

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

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `An account with this ${field} already exists.` });
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
  const message = status < 500 || err.isOperational ? err.message : 'Internal server error';
  res.status(status).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
  });
}

module.exports = { notFound, errorHandler, asyncHandler };
