const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  username: {
    type: String, // Store username denormalized for easier display
    required: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible field for extra context (e.g., invoice ID)
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Optional: Indexing for faster queries
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ user: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog; 