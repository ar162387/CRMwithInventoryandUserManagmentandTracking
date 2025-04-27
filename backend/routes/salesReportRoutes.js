const express = require('express');
const router = express.Router();
const salesReportController = require('../controllers/salesReportController');

// Inventory
router.get('/inventory/total-items', salesReportController.getTotalItems);

// Section A
router.get('/section-a', salesReportController.getSectionA);

// Section B
router.get('/top-selling-items', salesReportController.getTopSellingItems);

// Section C
router.get('/top-paying-customers', salesReportController.getTopPayingCustomers);

// Section D
router.get('/item-analysis', salesReportController.getItemAnalysis);

module.exports = router; 