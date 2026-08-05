const User = require('../models/User.model');
const { verifyToken } = require('../utils/jwt');
const { asyncHandler } = require('./error.middleware');

/**
 * Authenticates the request. Reads the JWT from the Authorization header
 * or the accessToken cookie, loads the user fresh from the database and
 * attaches it to req.user. No route is reachable without this.
 */
const authenticateUser = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;

  if (!token) {
    const error = new Error('Authentication required. Please sign in.');
    error.status = 401;
    error.isOperational = true;
    throw error;
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    const error = new Error('Session expired. Please sign in again.');
    error.status = 401;
    error.isOperational = true;
    throw error;
  }

  const user = await User.findById(payload.id).select('-password');
  if (!user) {
    const error = new Error('Account no longer exists.');
    error.status = 401;
    error.isOperational = true;
    throw error;
  }

  req.user = user;
  return next();
});

/**
 * Role-based access control. Usage: authorizeRoles('student', 'teacher').
 * Students can never reach teacher routes and vice versa.
 */
function authorizeRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error(`Access denied — this area is restricted to ${roles.join(' / ')} accounts.`);
      error.status = 403;
      error.isOperational = true;
      return next(error);
    }
    return next();
  };
}

module.exports = { authenticateUser, authorizeRoles };
