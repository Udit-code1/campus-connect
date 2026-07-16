const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  updatePreferences,
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications
router.get('/', getNotifications);

// PATCH /api/notifications/read-all
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', markAsRead);

// PUT /api/notifications/preferences
router.put('/preferences', updatePreferences);

module.exports = router;
