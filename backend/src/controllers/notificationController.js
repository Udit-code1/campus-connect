const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * Get notifications for current user
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    res.json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const { events, internships, applications } = req.body;

    const update = {};
    if (events !== undefined) update['notificationPreferences.events'] = events;
    if (internships !== undefined) update['notificationPreferences.internships'] = internships;
    if (applications !== undefined) update['notificationPreferences.applications'] = applications;

    const User = require('../models/User');
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });

    res.json({
      success: true,
      message: 'Notification preferences updated.',
      data: { preferences: user.notificationPreferences },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  updatePreferences,
};
