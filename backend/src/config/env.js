require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  MONGO_URI:
    process.env.MONGO_URI || 'mongodb://localhost:27017/evalai',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'evalai_access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'evalai_refresh_secret',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_ENABLED: process.env.REDIS_ENABLED === 'true',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Google Vision OCR
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_SHEETS_PER_EVALUATION: parseInt(process.env.MAX_SHEETS_PER_EVALUATION, 10) || 50,

  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@evalai.app',

  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 15 * 1024 * 1024,
};

module.exports = env;
