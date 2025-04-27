const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

/**
 * Logs an activity in the system
 * @param {Object} options - Logging options
 * @param {string} options.userId - The ID of the user performing the action
 * @param {string} options.username - The username of the user
 * @param {string} options.action - The action being performed
 * @param {Object} [options.details] - Additional details about the action
 */
const logActivity = async ({ userId, username, action, details = null }) => {
  try {
    // Ensure userId is a valid ObjectId - convert from string if necessary
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      console.error('Invalid userId for activity logging:', userId);
      console.error('Error converting userId to ObjectId:', error.message);
      return null;
    }

    const log = new ActivityLog({
      user: userObjectId,
      username,
      action,
      details,
      timestamp: new Date()
    });

    await log.save();
    console.log('Activity logged successfully:', {
      username,
      action,
      timestamp: new Date()
    });
    return log;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - just return null to avoid breaking application flow
    return null;
  }
};

module.exports = { logActivity }; 