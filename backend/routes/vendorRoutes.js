const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Search vendors (must come before /:id routes)
router.get('/search', vendorController.searchVendors);

// Get all vendors
router.get('/', vendorController.getAllVendors);

// Create new vendor
router.post('/', vendorController.createVendor);

// Get single vendor
router.get('/:id', vendorController.getVendor);

// Update vendor
router.put('/:id', vendorController.updateVendor);

// Delete vendor
router.delete('/:id', vendorController.deleteVendor);

module.exports = router; 