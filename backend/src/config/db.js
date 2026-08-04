const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return true;
  }
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info('✅ MongoDB connected');
  } catch (error) {
    logger.warn(`MongoDB unavailable (${error.message}). Using in-memory store.`);
    isConnected = false;
  }
  return isConnected;
}

async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  }
}

function isMongoConnected() {
  return isConnected;
}

module.exports = { connectDB, disconnectDB, isMongoConnected };
