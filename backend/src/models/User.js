const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      minlength: 6,
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ['student', 'society_admin', 'college_admin'],
      default: 'student',
    },
    department: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 5,
    },
    skills: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    interests: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    bookmarks: [
      {
        itemType: {
          type: String,
          enum: ['event', 'internship'],
        },
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'bookmarks.itemType',
        },
        savedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    applicationHistory: [
      {
        internship: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Internship',
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
      },
    ],
    googleId: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    refreshToken: {
      type: String,
      select: false,
    },
    societyName: {
      type: String,
      trim: true, // Only for society_admin role
    },
    notificationPreferences: {
      events: { type: Boolean, default: true },
      internships: { type: Boolean, default: true },
      applications: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ interests: 1 });

// Pre-save: hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Virtual: full profile completeness check
userSchema.virtual('isProfileComplete').get(function () {
  return !!(
    this.name &&
    this.email &&
    this.department &&
    this.year &&
    this.skills.length > 0 &&
    this.interests.length > 0
  );
});

module.exports = mongoose.model('User', userSchema);
