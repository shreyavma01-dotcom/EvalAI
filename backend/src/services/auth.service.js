const crypto = require('crypto');
const User = require('../models/User.model');
const { signToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const PUBLIC_ROLES = ['student', 'teacher'];

/**
 * Registers a new student or teacher account. Admin accounts are only
 * created via the seed script or directly in the database.
 */
async function register({ name, email, password, confirmPassword, role = 'student' }) {
  if (!name || !email || !password) {
    const error = new Error('Full name, email and password are required.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }
  if (password !== confirmPassword) {
    const error = new Error('Passwords do not match.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }
  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }
  const safeRole = String(role).toLowerCase();
  if (!PUBLIC_ROLES.includes(safeRole)) {
    const error = new Error('Role must be student or teacher.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existing) {
    const error = new Error('An account with this email already exists.');
    error.status = 409;
    error.isOperational = true;
    throw error;
  }

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    password,
    role: safeRole,
  });

  return { token: signToken(user), user: user.toSafeJSON() };
}

/**
 * Signs a user in. remember -> longer-lived token.
 */
async function login({ email, password, remember = false }) {
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    error.isOperational = true;
    throw error;
  }

  return { token: signToken(user, remember), user: user.toSafeJSON() };
}

/**
 * Loads the current user's safe profile.
 */
async function me(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Account not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }
  return user.toSafeJSON();
}

/**
 * Forgot password — issues a reset token (stored hashed) and returns it.
 * Email transport can be plugged in via SMTP env vars later; for now the
 * token is logged and returned so the reset flow is fully functional.
 */
async function forgotPassword({ email }) {
  const user = await User.findOne({ email: String(email || '').toLowerCase().trim() });
  if (!user) {
    // Do not leak account existence.
    return { ok: true, message: 'If an account exists, a reset link has been prepared.' };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  logger.info(`Password reset token for ${user.email}: ${rawToken}`);
  return { ok: true, message: 'If an account exists, a reset link has been prepared.', resetToken: rawToken };
}

/**
 * Reset password with a valid, unexpired token.
 */
async function resetPassword({ token, password, confirmPassword }) {
  if (!token || !password) {
    const error = new Error('Reset token and new password are required.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }
  if (password !== confirmPassword) {
    const error = new Error('Passwords do not match.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }
  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  const hashed = crypto.createHash('sha256').update(String(token)).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: new Date() } });
  if (!user) {
    const error = new Error('Reset token is invalid or has expired. Request a new one.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { ok: true, message: 'Password reset successfully. You can now sign in.' };
}

module.exports = { register, login, me, forgotPassword, resetPassword };
