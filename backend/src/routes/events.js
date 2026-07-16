const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  cancelRsvp,
} = require('../controllers/eventController');

// GET /api/events — list with filters (public)
router.get('/', getEvents);

// GET /api/events/:id — single event (public)
router.get('/:id', getEvent);

// POST /api/events — create (society_admin, college_admin)
router.post(
  '/',
  authenticate,
  authorize('society_admin', 'college_admin'),
  validate([
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('venue').trim().notEmpty().withMessage('Venue is required'),
    body('category')
      .isIn(['cultural', 'technical', 'sports', 'workshop', 'seminar', 'social', 'other'])
      .withMessage('Invalid category'),
    body('tags').optional().isArray(),
    body('maxCapacity').optional().isInt({ min: 0 }),
  ]),
  createEvent
);

// PUT /api/events/:id — update (owner or admin)
router.put(
  '/:id',
  authenticate,
  authorize('society_admin', 'college_admin'),
  updateEvent
);

// DELETE /api/events/:id — delete (owner or admin)
router.delete(
  '/:id',
  authenticate,
  authorize('society_admin', 'college_admin'),
  deleteEvent
);

// POST /api/events/:id/rsvp — register for event (student)
router.post('/:id/rsvp', authenticate, rsvpEvent);

// DELETE /api/events/:id/rsvp — cancel RSVP
router.delete('/:id/rsvp', authenticate, cancelRsvp);

module.exports = router;
