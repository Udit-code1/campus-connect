const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  recommendEvents,
  recommendInternships,
} = require('../controllers/recommendController');

// All recommendation routes require authentication
router.use(authenticate);

// GET /api/recommend/events
router.get('/events', recommendEvents);

// GET /api/recommend/internships
router.get('/internships', recommendInternships);

module.exports = router;
