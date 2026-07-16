const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  addBookmark,
  removeBookmark,
  getBookmarks,
} = require('../controllers/userController');

// All user routes require authentication
router.use(authenticate);

// GET /api/users/profile
router.get('/profile', getProfile);

// PUT /api/users/profile
router.put('/profile', updateProfile);

// GET /api/users/bookmarks
router.get('/bookmarks', getBookmarks);

// POST /api/users/bookmarks/:type/:id
router.post('/bookmarks/:type/:id', addBookmark);

// DELETE /api/users/bookmarks/:type/:id
router.delete('/bookmarks/:type/:id', removeBookmark);

module.exports = router;
