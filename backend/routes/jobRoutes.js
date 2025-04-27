const express = require('express');
const router = express.Router();
const { runJobManually, scheduledJobs } = require('../jobs');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

/**
 * @route GET /api/jobs
 * @desc Get all scheduled jobs
 * @access Admin only
 */
router.get('/', authenticateToken, authorizeRole(['Admin']), (req, res) => {
  try {
    const jobList = scheduledJobs.map(job => ({
      name: job.name,
      schedule: job.schedule
    }));

    res.status(200).json(jobList);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch job list', error: error.message });
  }
});

/**
 * @route POST /api/jobs/run/:jobName
 * @desc Run a job manually
 * @access Admin only
 */
router.post('/run/:jobName', authenticateToken, authorizeRole(['Admin']), async (req, res) => {
  try {
    const { jobName } = req.params;

    // Log who triggered the job
    console.log(`Manual job run: ${jobName} triggered by user ${req.user.username} (${req.user.id})`);

    // Run the job
    const result = await runJobManually(jobName);

    res.status(200).json({
      message: `Job ${jobName} completed successfully`,
      result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(`Error running job ${req.params.jobName}:`, error);
    res.status(500).json({
      message: `Failed to run job ${req.params.jobName}`,
      error: error.message
    });
  }
});

module.exports = router; 