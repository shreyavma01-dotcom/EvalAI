/* eslint-disable no-console */
const { createServer } = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initRedis } = require('./config/redis');
const { initSocket } = require('./sockets');
const { seedDemoUsers } = require('./services/seed.service');
const logger = require('./utils/logger');
const { PORT, NODE_ENV } = require('./config/env');

let server;

async function bootstrap() {
  try {
    await connectDB();
    await initRedis();

    // Idempotent demo accounts — safe to run on every boot.
    await seedDemoUsers().catch((err) => {
      logger.warn(`Demo user seeding skipped: ${err.message}`);
    });

    server = createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
    });
  } catch (error) {
    logger.error('Failed to bootstrap server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      try {
        const { closeRedis } = require('./config/redis');
        const { disconnectDB } = require('./config/db');
        await closeRedis();
        await disconnectDB();
        logger.info('Cleanup complete. Exiting.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});

bootstrap();
