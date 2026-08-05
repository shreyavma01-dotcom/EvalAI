const { Router } = require('express');
const { authenticateUser } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const notificationService = require('../services/notification.service');

const router = Router();

router.use(authenticateUser);

/**
 * GET /api/notifications — current user's notifications + unread count.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [items, unread] = await Promise.all([
      notificationService.listForUser(req.user._id),
      notificationService.unreadCount(req.user._id),
    ]);
    return res.json({ success: true, data: { items, unread } });
  })
);

/**
 * PUT /api/notifications/read/:id — mark one as read.
 */
router.put(
  '/read/:id',
  asyncHandler(async (req, res) => {
    const data = await notificationService.markRead(req.user._id, req.params.id);
    return res.json({ success: true, data });
  })
);

/**
 * PUT /api/notifications/read-all — mark all as read.
 */
router.put(
  '/read-all',
  asyncHandler(async (req, res) => {
    const unread = await notificationService.markAllRead(req.user._id);
    return res.json({ success: true, data: { unread } });
  })
);

module.exports = router;