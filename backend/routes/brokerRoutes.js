const express = require('express');
const router = express.Router();
const brokerController = require('../controllers/brokerController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Search brokers (must come before /:id routes)
router.get('/search', brokerController.searchBrokers);

// Get all brokers
router.get('/', brokerController.getAllBrokers);

// Create new broker
router.post('/', brokerController.createBroker);

// Get broker summary for all brokers
router.get('/summary/all', brokerController.getBrokerSummary);

// Get single broker
router.get('/:id', brokerController.getBroker);

// Update broker
router.put('/:id', brokerController.updateBroker);

// Delete broker
router.delete('/:id', brokerController.deleteBroker);

// Get broker summary
router.get('/:id/summary', brokerController.getBrokerSummary);

// Get broker invoices
router.get('/:id/invoices', brokerController.getBrokerInvoices);

// Add payment to broker
router.post('/:id/payments', brokerController.addPayment);

// Update broker due date
router.put('/:id/due-date', brokerController.updateDueDate);

module.exports = router; 