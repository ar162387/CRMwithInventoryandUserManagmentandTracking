const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken } = require('../middleware/authMiddleware'); // Only need authentication

const router = express.Router();

// Middleware: Apply authentication to all activity log routes
router.use(authenticateToken);

// GET /api/activity-log - Get all activity logs (sorted by most recent)
// Add query parameters for pagination and filtering later if needed
router.get('/', async (req, res) => {
  try {
    // Fetch logs, populate user details (excluding password), sort by latest first
    const logs = await ActivityLog.find()
      .populate('user', '-password') // Use 'user' field and exclude password
      .sort({ timestamp: -1 })
      .lean(); // Convert to plain JavaScript objects for better performance

    // Format the logs for response
    const formattedLogs = logs.map(log => ({
      _id: log._id,
      timestamp: log.timestamp,
      action: log.action,
      details: log.details,
      username: log.user?.username || log.username,
      fullname: log.user?.fullname,
      role: log.user?.role
    }));

    res.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 