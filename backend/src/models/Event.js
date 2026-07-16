const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: 5000,
    },
    society: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    endDate: {
      type: Date,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['cultural', 'technical', 'sports', 'workshop', 'seminar', 'social', 'other'],
      required: [true, 'Category is required'],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    registrations: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    mediaUrls: [
      {
        url: String,
        type: {
          type: String,
          enum: ['image', 'video', 'document'],
          default: 'image',
        },
      },
    ],
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'past', 'cancelled'],
      default: 'upcoming',
    },
    maxCapacity: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual: registration count
eventSchema.virtual('registrationCount').get(function () {
  return this.registrations ? this.registrations.length : 0;
});

// Virtual: is registration open
eventSchema.virtual('isRegistrationOpen').get(function () {
  if (this.status !== 'upcoming') return false;
  if (this.maxCapacity === 0) return true; // Unlimited
  return this.registrations.length < this.maxCapacity;
});

module.exports = mongoose.model('Event', eventSchema);
