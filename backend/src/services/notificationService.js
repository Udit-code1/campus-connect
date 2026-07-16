const Notification = require('../models/Notification');
const User = require('../models/User');
const { getIO } = require('../sockets');

/**
 * Check if the user's preferences permit this notification type
 * @param {User} user - User object
 * @param {string} type - Notification type
 * @returns {boolean} Whether user allows this notification
 */
const isPermittedByPreference = (user, type) => {
  if (!user.notificationPreferences) return true;

  const preferences = user.notificationPreferences;

  if (['event_new', 'event_reminder', 'event_cancelled', 'rsvp_confirmed'].includes(type)) {
    return preferences.events !== false;
  }

  if (['internship_new', 'internship_deadline'].includes(type)) {
    return preferences.internships !== false;
  }

  if (['application_status'].includes(type)) {
    return preferences.applications !== false;
  }

  return true; // default to send for other/general notifications
};

/**
 * Create a notification record and send it in real-time if online
 * @param {Object} params
 * @param {string} params.recipient - ID of recipient user
 * @param {string} params.type - enum type
 * @param {string} params.title - title
 * @param {string} params.message - content
 * @param {string} [params.link] - optional URL/path
 * @param {string} [params.relatedId] - related item ID (Event or Internship)
 */
const sendNotification = async ({ recipient, type, title, message, link, relatedId }) => {
  try {
    // 1. Fetch recipient to check preferences
    const user = await User.findById(recipient);
    if (!user) {
      console.warn(`⚠️ Notification target user ${recipient} not found. Skipping.`);
      return null;
    }

    // 2. Check preferences
    if (!isPermittedByPreference(user, type)) {
      // User turned off notifications for this category
      return null;
    }

    // 3. Save to database
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      link,
      relatedId,
    });

    // 4. Emit socket.io real-time event
    try {
      const io = getIO();
      io.to(recipient.toString()).emit('notification:new', {
        notification,
        unreadCount: await Notification.countDocuments({ recipient, isRead: false }),
      });
    } catch (socketErr) {
      // Socket not initialized or offline, fail gracefully
      console.warn('⚠️ WebSockets not available for notifying user:', socketErr.message);
    }

    return notification;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return null;
  }
};

/**
 * Broadcast notification to all students
 */
const broadcastToAllStudents = async ({ type, title, message, link, relatedId }) => {
  try {
    const students = await User.find({ role: 'student' }).select('_id notificationPreferences');
    const notifications = [];

    for (const student of students) {
      if (isPermittedByPreference(student, type)) {
        notifications.push({
          recipient: student._id,
          type,
          title,
          message,
          link,
          relatedId,
        });
      }
    }

    if (notifications.length === 0) return;

    // Bulk insert for efficiency
    await Notification.insertMany(notifications);

    // Emit live socket updates to students
    try {
      const io = getIO();
      // Since it's a broadcast to all matching, emit on general io space or to user rooms
      for (const student of students) {
        if (isPermittedByPreference(student, type)) {
          io.to(student._id.toString()).emit('notification:new', {
            // We can retrieve the individual created notification, but for simplicity:
            notification: { type, title, message, link, relatedId, isRead: false, createdAt: new Date() },
          });
        }
      }
    } catch {
      // socket fail-safe
    }
  } catch (error) {
    console.error('❌ Error broadcasting notification:', error);
  }
};

module.exports = {
  sendNotification,
  broadcastToAllStudents,
};
