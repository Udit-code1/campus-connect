const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['event', 'internship'],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'type',
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    source: {
      type: String,
      enum: ['content', 'collaborative', 'ai', 'hybrid'],
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
recommendationSchema.index({ userId: 1, type: 1 });
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('Recommendation', recommendationSchema);
