const Notification = require('../models/Notification.model');
const { getIO } = require('../sockets');
const logger = require('../utils/logger');

/**
 * Creates a notification for a user and emits it to their socket room when
 * the client is connected. If the user has no live socket, it is simply
 * persisted and picked up by polling.
 */
async function notify(userId, { type = 'system', title, message, data }) {
  if (!userId) return null;
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    data: data || null,
  });

  try {
    getIO()?.to(`user:${userId}`).emit('notification:new', {
      id: notification._id,
      type,
      title,
      message,
      data,
      createdAt: notification.createdAt,
    });
  } catch (err) {
    logger.warn(`Socket notify failed: ${err.message}`);
  }
  return notification;
}

/**
 * Lists the user's notifications, newest first. Cap at 50.
 */
async function listForUser(userId) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
}

async function unreadCount(userId) {
  return Notification.countDocuments({ userId, read: false });
}

async function markRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
  if (!notification) {
    const error = new Error('Notification not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }
  return notification;
}

async function markAllRead(userId) {
  await Notification.updateMany({ userId, read: false }, { read: true });
  return unreadCount(userId);
}

module.exports = { notify, listForUser, unreadCount, markRead, markAllRead };