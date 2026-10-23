const Notification = require('../models/Notification');

// @desc  Get notifications for current user
// @route GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const unreadOnly = req.query.unread === 'true';

    const query = { userId: req.user._id };
    if (unreadOnly) query.read = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort('-createdAt')
        .limit(limit)
        .populate('projectId', 'projectName'),
      Notification.countDocuments({ userId: req.user._id, read: false }),
    ]);

    res.status(200).json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Mark one or all notifications as read
// @route PUT /api/notifications/read
const markRead = async (req, res, next) => {
  try {
    const { ids, all } = req.body; // ids: string[] | all: boolean

    if (all) {
      await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    } else if (Array.isArray(ids) && ids.length) {
      await Notification.updateMany(
        { _id: { $in: ids }, userId: req.user._id },
        { read: true }
      );
    }

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.status(200).json({ success: true, data: { unreadCount } });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete a notification
// @route DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc  Get unread count only (lightweight poll)
// @route GET /api/notifications/count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markRead, deleteNotification, getUnreadCount };
