const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Search customers (must come before /:id routes)
router.get('/search', customerController.searchCustomers);

// Get all customers
router.get('/', customerController.getAllCustomers);

// Create new customer
router.post('/', customerController.createCustomer);

// Get single customer
router.get('/:id', customerController.getCustomer);

// Update customer
router.put('/:id', customerController.updateCustomer);

// Delete customer
router.delete('/:id', customerController.deleteCustomer);

module.exports = router; 