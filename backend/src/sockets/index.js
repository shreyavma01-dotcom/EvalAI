const { Server } = require('socket.io');
const { CLIENT_URL } = require('../config/env');
const logger = require('../utils/logger');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Evaluation pipeline progress rooms.
    socket.on('join:evaluation', (evaluationId) => {
      if (evaluationId) socket.join(`evaluation:${evaluationId}`);
    });
    socket.on('leave:evaluation', (evaluationId) => {
      if (evaluationId) socket.leave(`evaluation:${evaluationId}`);
    });

    // User-scoped notification rooms (userId passed by the client).
    socket.on('join:user', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });
    socket.on('leave:user', (userId) => {
      if (userId) socket.leave(`user:${userId}`);
    });
  });

  logger.info('🟢 Socket.io initialized');
  return io;
}

function getIO() {
  return io;
}

/**
 * Emits an event to a user's personal room. Safe to call before any client
 * connects — events fall back to the polling notification endpoints.
 */
function emitToUser(userId, event, payload) {
  try {
    io?.to(`user:${userId}`).emit(event, payload);
  } catch (err) {
    logger.warn(`Socket emit to user ${userId} failed: ${err.message}`);
  }
}

module.exports = { initSocket, getIO, emitToUser };