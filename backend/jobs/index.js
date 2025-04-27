/**
 * Job Scheduler Service
 * Centralizes and manages all scheduled jobs
 */
const cron = require('node-cron');
const { runInvoiceStatusUpdates } = require('./invoiceStatusUpdater');

// Collection of all scheduled jobs
const scheduledJobs = [];

/**
 * Schedule invoice status updates to run at midnight every day
 * This job will look for invoices that have passed their due dates
 * and mark them as overdue
 */
const scheduleInvoiceStatusUpdates = () => {
  // Schedule to run at 00:00 (midnight) every day
  const job = cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Starting scheduled invoice status update job');
      await runInvoiceStatusUpdates();
      console.log('Scheduled invoice status update job completed');
    } catch (error) {
      console.error('Scheduled invoice status update job failed:', error);
    }
  });

  scheduledJobs.push({
    name: 'Invoice Status Updates',
    schedule: '0 0 * * *',
    job
  });

  console.log('Invoice status update job scheduled to run at midnight daily');
  return job;
};

/**
 * Initialize all scheduled jobs
 */
const initializeJobs = () => {
  // Schedule all jobs
  scheduleInvoiceStatusUpdates();

  console.log(`${scheduledJobs.length} jobs scheduled`);

  // Return the list of scheduled jobs for monitoring
  return scheduledJobs;
};

/**
 * Run a job manually by its name
 * @param {string} jobName - The name of the job to run
 * @returns {Promise<any>} Result of the job
 */
const runJobManually = async (jobName) => {
  switch (jobName) {
    case 'Invoice Status Updates':
      return await runInvoiceStatusUpdates();
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }
};

module.exports = {
  initializeJobs,
  runJobManually,
  scheduledJobs
}; 