const { Router } = require('express');
const { authenticateUser } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const authService = require('../services/auth.service');

const router = Router();

/**
 * POST /api/auth/register — new student/teacher account.
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { token, user } = await authService.register(req.body);
    return res.status(201).json({ success: true, data: { token, user } });
  })
);

/**
 * POST /api/auth/login — email + password.
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { token, user } = await authService.login(req.body);
    res.cookie('accessToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure || false,
      maxAge: req.body?.remember ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true, data: { token, user } });
  })
);

/**
 * POST /api/auth/logout — clears the session cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  return res.json({ success: true, message: 'Signed out.' });
});

/**
 * GET /api/auth/me — current user profile.
 */
router.get('/me', authenticateUser, asyncHandler(async (req, res) => {
  const user = await authService.me(req.user._id);
  return res.json({ success: true, data: { user } });
}));

/**
 * POST /api/auth/forgot-password — placeholder-safe, backend ready.
 */
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body);
    return res.json({ success: true, data: result });
  })
);

/**
 * POST /api/auth/reset-password — backend ready.
 */
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    return res.json({ success: true, data: result });
  })
);

module.exports = router;
