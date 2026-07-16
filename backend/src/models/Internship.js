const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role/position is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 5000,
    },
    stipend: {
      amount: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      isPaid: {
        type: Boolean,
        default: true,
      },
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true, // e.g., "3 months", "6 weeks"
    },
    skills: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    eligibility: {
      departments: [String],
      minYear: { type: Number, default: 1 },
      maxYear: { type: Number, default: 4 },
      minCGPA: { type: Number, default: 0 },
      additionalRequirements: String,
    },
    deadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    applicants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['applied', 'shortlisted', 'accepted', 'rejected'],
          default: 'applied',
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        resumeUrl: String,
      },
    ],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyLogo: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['remote', 'onsite', 'hybrid'],
      default: 'onsite',
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'filled'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
internshipSchema.index({ deadline: 1 });
internshipSchema.index({ skills: 1 });
internshipSchema.index({ postedBy: 1 });
internshipSchema.index({ status: 1 });
internshipSchema.index({ company: 'text', role: 'text', description: 'text' });

// Virtual: applicant count
internshipSchema.virtual('applicantCount').get(function () {
  return this.applicants ? this.applicants.length : 0;
});

// Virtual: is deadline passed
internshipSchema.virtual('isExpired').get(function () {
  return new Date() > this.deadline;
});

module.exports = mongoose.model('Internship', internshipSchema);
