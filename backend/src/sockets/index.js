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
    socket.on('join:evaluation', (evaluationId) => {
      if (evaluationId) socket.join(`evaluation:${evaluationId}`);
    });
    socket.on('leave:evaluation', (evaluationId) => {
      if (evaluationId) socket.leave(`evaluation:${evaluationId}`);
    });
  });

  logger.info('🟢 Socket.io initialized');
  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
