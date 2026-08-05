const { Router } = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const adminService = require('../services/admin.service');

const router = Router();

router.use(authenticateUser, authorizeRoles('admin'));

/**
 * GET /api/admin/dashboard — user + submission stats.
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const data = await adminService.getDashboard();
    return res.json({ success: true, data });
  })
);

module.exports = router;