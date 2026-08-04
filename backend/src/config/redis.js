const Redis = require('ioredis');
const { REDIS_URL, REDIS_ENABLED } = require('./env');
const logger = require('../utils/logger');

let client = null;

async function initRedis() {
  if (!REDIS_ENABLED) {
    logger.warn('Redis is disabled. Falling back to in-memory behavior.');
    return null;
  }
  try {
    client = new Redis(REDIS_URL, { maxRetriesPerRequest: 1 });
    client.on('connect', () => logger.info('✅ Redis connected'));
    client.on('error', (err) => {
      logger.warn(`Redis error: ${err.message}. Continuing without Redis.`);
    });
    await client.ping();
    return client;
  } catch (error) {
    logger.warn(`Failed to connect to Redis: ${error.message}. Continuing without Redis.`);
    client = null;
    return null;
  }
}

async function closeRedis() {
  if (client) {
    try {
      await client.quit();
    } catch (err) {
      logger.warn(`Redis quit error: ${err.message}`);
    }
    client = null;
  }
}

function getRedis() {
  return client;
}

module.exports = { initRedis, closeRedis, getRedis };
