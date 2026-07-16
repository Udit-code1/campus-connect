const User = require('../models/User');
const Event = require('../models/Event');
const Internship = require('../models/Internship');

/**
 * GET /api/users/profile
 * Get current user's profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'name',
      'department',
      'year',
      'skills',
      'interests',
      'avatar',
      'societyName',
      'notificationPreferences',
    ];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Normalize skills and interests to lowercase
    if (updates.skills) {
      updates.skills = updates.skills.map((s) => s.toLowerCase().trim());
    }
    if (updates.interests) {
      updates.interests = updates.interests.map((i) => i.toLowerCase().trim());
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/bookmarks/:type/:id
 * Bookmark an event or internship
 */
const addBookmark = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    if (!['event', 'internship'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "event" or "internship".',
      });
    }

    // Verify item exists
    const Model = type === 'event' ? Event : Internship;
    const item = await Model.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found.`,
      });
    }

    // Check if already bookmarked
    const user = await User.findById(req.user._id);
    const alreadyBookmarked = user.bookmarks.some(
      (b) => b.itemType === type && b.itemId.toString() === id
    );

    if (alreadyBookmarked) {
      return res.status(400).json({
        success: false,
        message: 'Already bookmarked.',
      });
    }

    user.bookmarks.push({ itemType: type, itemId: id });
    await user.save();

    res.json({
      success: true,
      message: 'Bookmarked successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/bookmarks/:type/:id
 * Remove a bookmark
 */
const removeBookmark = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    await User.findByIdAndUpdate(req.user._id, {
      $pull: {
        bookmarks: { itemType: type, itemId: id },
      },
    });

    res.json({
      success: true,
      message: 'Bookmark removed.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/bookmarks
 * Get all bookmarks with populated items
 */
const getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Separate by type and populate
    const eventIds = user.bookmarks
      .filter((b) => b.itemType === 'event')
      .map((b) => b.itemId);
    const internshipIds = user.bookmarks
      .filter((b) => b.itemType === 'internship')
      .map((b) => b.itemId);

    const [events, internships] = await Promise.all([
      Event.find({ _id: { $in: eventIds } }).populate(
        'createdBy',
        'name societyName'
      ),
      Internship.find({ _id: { $in: internshipIds } }).select('-applicants'),
    ]);

    res.json({
      success: true,
      data: { events, internships },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  addBookmark,
  removeBookmark,
  getBookmarks,
};
