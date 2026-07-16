const router = require('express').Router();
const { body } = require('express-validator');
const passport = require('passport');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  refreshToken,
  logout,
  googleCallback,
} = require('../controllers/authController');

// POST /api/auth/register
router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['student', 'society_admin', 'college_admin'])
      .withMessage('Invalid role'),
    body('department').optional({ values: 'falsy' }).trim(),
    body('year').optional({ values: 'falsy' }).isInt({ min: 1, max: 5 }),
    body('societyName').optional({ values: 'falsy' }).trim(),
  ]),
  register
);

// POST /api/auth/login
router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ]),
  refreshToken
);

// POST /api/auth/logout
router.post('/logout', authenticate, logout);

// GET /api/auth/google — initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// GET /api/auth/google/callback — handle OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
  }),
  googleCallback
);

module.exports = router;
