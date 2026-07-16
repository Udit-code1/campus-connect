const Event = require('../models/Event');
const { getIO } = require('../sockets');

/**
 * GET /api/events
 * List events with filtering, search, and pagination
 */
const getEvents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      status,
      tags,
      search,
      startDate,
      endDate,
      sortBy = 'date',
      order = 'asc',
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (tags) query.tags = { $in: tags.split(',').map((t) => t.trim().toLowerCase()) };
    if (search) query.$text = { $search: search };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('createdBy', 'name email avatar societyName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        events,
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
 * GET /api/events/:id
 * Get single event with populated registrations
 */
const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email avatar societyName')
      .populate('registrations.user', 'name email avatar department');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    res.json({ success: true, data: { event } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/events
 * Create a new event (society_admin or college_admin)
 */
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      society,
      date,
      endDate,
      venue,
      category,
      tags,
      maxCapacity,
    } = req.body;

    const event = await Event.create({
      title,
      description,
      society: society || req.user.societyName,
      date,
      endDate,
      venue,
      category,
      tags: tags ? tags.map((t) => t.toLowerCase().trim()) : [],
      maxCapacity: maxCapacity || 0,
      createdBy: req.user._id,
      isApproved: req.user.role === 'college_admin', // Auto-approve for admins
    });

    // Populate creator info
    await event.populate('createdBy', 'name email avatar societyName');

    // Emit real-time notification
    try {
      const io = getIO();
      io.emit('event:new', {
        event,
        message: `New event: ${event.title}`,
      });
    } catch {
      // Socket not initialized yet — skip
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/events/:id
 * Update an event (owner or college_admin)
 */
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // Check ownership or admin
    if (
      req.user.role !== 'college_admin' &&
      event.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event.',
      });
    }

    const allowedUpdates = [
      'title',
      'description',
      'date',
      'endDate',
      'venue',
      'category',
      'tags',
      'maxCapacity',
      'status',
      'mediaUrls',
      'isApproved',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();
    await event.populate('createdBy', 'name email avatar societyName');

    res.json({
      success: true,
      message: 'Event updated successfully.',
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/events/:id
 * Delete an event (owner or college_admin)
 */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    if (
      req.user.role !== 'college_admin' &&
      event.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event.',
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/events/:id/rsvp
 * RSVP to an event (student)
 */
const rsvpEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // Check if already registered
    const alreadyRegistered = event.registrations.some(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event.',
      });
    }

    // Check capacity
    if (event.maxCapacity > 0 && event.registrations.length >= event.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is at full capacity.',
      });
    }

    event.registrations.push({ user: req.user._id });
    await event.save();

    // Emit live count update
    try {
      const io = getIO();
      io.to(`event:${event._id}`).emit('rsvp:update', {
        eventId: event._id,
        count: event.registrations.length,
      });
    } catch {
      // Socket not initialized
    }

    res.json({
      success: true,
      message: 'Successfully registered for the event.',
      data: { registrationCount: event.registrations.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/events/:id/rsvp
 * Cancel RSVP
 */
const cancelRsvp = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const regIndex = event.registrations.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (regIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this event.',
      });
    }

    event.registrations.splice(regIndex, 1);
    await event.save();

    // Emit live count update
    try {
      const io = getIO();
      io.to(`event:${event._id}`).emit('rsvp:update', {
        eventId: event._id,
        count: event.registrations.length,
      });
    } catch {
      // Socket not initialized
    }

    res.json({
      success: true,
      message: 'RSVP cancelled successfully.',
      data: { registrationCount: event.registrations.length },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  cancelRsvp,
};
