const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  getInternships,
  getInternship,
  createInternship,
  updateInternship,
  deleteInternship,
  applyInternship,
  updateApplicationStatus,
} = require('../controllers/internshipController');

// GET /api/internships — list with filters (public)
router.get('/', getInternships);

// GET /api/internships/:id — single internship
router.get('/:id', authenticate, getInternship);

// POST /api/internships — create (college_admin only)
router.post(
  '/',
  authenticate,
  authorize('college_admin'),
  validate([
    body('company').trim().notEmpty().withMessage('Company name is required'),
    body('role').trim().notEmpty().withMessage('Role is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('duration').trim().notEmpty().withMessage('Duration is required'),
    body('deadline').isISO8601().withMessage('Valid deadline is required'),
    body('skills').optional().isArray(),
    body('type')
      .optional()
      .isIn(['remote', 'onsite', 'hybrid'])
      .withMessage('Invalid type'),
  ]),
  createInternship
);

// PUT /api/internships/:id — update (college_admin)
router.put(
  '/:id',
  authenticate,
  authorize('college_admin'),
  updateInternship
);

// DELETE /api/internships/:id — delete (college_admin)
router.delete(
  '/:id',
  authenticate,
  authorize('college_admin'),
  deleteInternship
);

// POST /api/internships/:id/apply — apply (student)
router.post(
  '/:id/apply',
  authenticate,
  authorize('student'),
  applyInternship
);

// PATCH /api/internships/:id/applicants/:userId — update status (college_admin)
router.patch(
  '/:id/applicants/:userId',
  authenticate,
  authorize('college_admin'),
  validate([
    body('status')
      .isIn(['applied', 'shortlisted', 'accepted', 'rejected'])
      .withMessage('Invalid status'),
  ]),
  updateApplicationStatus
);

module.exports = router;
