const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get total balance
router.get('/total', balanceController.getTotalBalance);

// Get all balance entries with filtering and pagination
router.get('/', balanceController.getAllBalanceEntries);

// Add a balance entry (Admin only)
router.post('/', authorizeRole(['Admin']), balanceController.addBalanceEntry);

// Update a balance entry (Admin only)
router.put('/:id', authorizeRole(['Admin']), balanceController.updateBalanceEntry);

// Delete a balance entry (Admin only)
router.delete('/:id', authorizeRole(['Admin']), balanceController.deleteBalanceEntry);

module.exports = router; 