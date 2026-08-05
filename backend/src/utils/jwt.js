const jwt = require('jsonwebtoken');
const { JWT_ACCESS_SECRET } = require('../config/env');

/**
 * Signs a JWT access token for a user.
 */
function signToken(user, remember = false) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: remember ? '30d' : '7d' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

module.exports = { signToken, verifyToken };
