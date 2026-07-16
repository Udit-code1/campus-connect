const Internship = require('../models/Internship');
const User = require('../models/User');
const { getIO } = require('../sockets');

/**
 * GET /api/internships
 * List internships with filtering and pagination
 */
const getInternships = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      skills,
      type,
      status,
      search,
      sortBy = 'deadline',
      order = 'asc',
    } = req.query;

    const query = {};

    if (skills) query.skills = { $in: skills.split(',').map((s) => s.trim().toLowerCase()) };
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

    const [internships, total] = await Promise.all([
      Internship.find(query)
        .populate('postedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-applicants'), // Don't expose applicant list in listing
      Internship.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        internships,
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
 * GET /api/internships/:id
 * Get single internship with applicant count
 */
const getInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id)
      .populate('postedBy', 'name email');

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found.',
      });
    }

    // Only admins see full applicant details
    const data = internship.toObject();
    if (req.user && req.user.role !== 'college_admin') {
      // Check if current user has applied
      const userApplication = data.applicants.find(
        (a) => a.user.toString() === req.user._id.toString()
      );
      data.hasApplied = !!userApplication;
      data.applicationStatus = userApplication?.status || null;
      data.applicants = undefined;
      data.applicantCount = internship.applicantCount;
    }

    res.json({ success: true, data: { internship: data } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/internships
 * Create internship (college_admin only)
 */
const createInternship = async (req, res, next) => {
  try {
    const {
      company,
      role,
      description,
      stipend,
      duration,
      skills,
      eligibility,
      deadline,
      location,
      type,
      companyLogo,
    } = req.body;

    const internship = await Internship.create({
      company,
      role,
      description,
      stipend,
      duration,
      skills: skills ? skills.map((s) => s.toLowerCase().trim()) : [],
      eligibility,
      deadline,
      location,
      type,
      companyLogo,
      postedBy: req.user._id,
    });

    await internship.populate('postedBy', 'name email');

    // Emit real-time notification
    try {
      const io = getIO();
      io.emit('internship:new', {
        internship: {
          id: internship._id,
          company: internship.company,
          role: internship.role,
          skills: internship.skills,
        },
        message: `New internship: ${internship.role} at ${internship.company}`,
      });
    } catch {
      // Socket not initialized
    }

    res.status(201).json({
      success: true,
      message: 'Internship posted successfully.',
      data: { internship },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/internships/:id
 * Update internship (college_admin only)
 */
const updateInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found.',
      });
    }

    const allowedUpdates = [
      'company',
      'role',
      'description',
      'stipend',
      'duration',
      'skills',
      'eligibility',
      'deadline',
      'location',
      'type',
      'companyLogo',
      'status',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        internship[field] = req.body[field];
      }
    });

    await internship.save();
    await internship.populate('postedBy', 'name email');

    res.json({
      success: true,
      message: 'Internship updated successfully.',
      data: { internship },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/internships/:id
 * Delete internship (college_admin only)
 */
const deleteInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findByIdAndDelete(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found.',
      });
    }

    res.json({
      success: true,
      message: 'Internship deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/internships/:id/apply
 * Apply for internship (student)
 */
const applyInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found.',
      });
    }

    // Check deadline
    if (new Date() > internship.deadline) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed.',
      });
    }

    // Check if already applied
    const alreadyApplied = internship.applicants.some(
      (a) => a.user.toString() === req.user._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this internship.',
      });
    }

    // Add applicant
    internship.applicants.push({
      user: req.user._id,
      resumeUrl: req.body.resumeUrl || '',
    });
    await internship.save();

    // Update user's application history
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        applicationHistory: {
          internship: internship._id,
          status: 'applied',
        },
      },
    });

    res.json({
      success: true,
      message: 'Application submitted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/internships/:id/applicants/:userId
 * Update application status (college_admin only)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { status } = req.body;

    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({
        success: false,
        message: 'Internship not found.',
      });
    }

    const applicant = internship.applicants.find(
      (a) => a.user.toString() === userId
    );

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found.',
      });
    }

    applicant.status = status;
    await internship.save();

    // Update user's application history
    await User.updateOne(
      { _id: userId, 'applicationHistory.internship': id },
      { $set: { 'applicationHistory.$.status': status } }
    );

    // Emit notification to user
    try {
      const io = getIO();
      io.to(userId).emit('application:status', {
        internshipId: id,
        company: internship.company,
        role: internship.role,
        status,
        message: `Your application for ${internship.role} at ${internship.company} has been ${status}.`,
      });
    } catch {
      // Socket not initialized
    }

    res.json({
      success: true,
      message: `Application status updated to ${status}.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInternships,
  getInternship,
  createInternship,
  updateInternship,
  deleteInternship,
  applyInternship,
  updateApplicationStatus,
};
