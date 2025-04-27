const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply auth middleware
router.use(authenticateToken);

// ---------------- Customer Invoice ----------------
router.get('/customers/remaining', dashboardController.getCustomerRemaining);
router.get('/customers/paid', dashboardController.getCustomerPaid);
router.get('/customers/reminders', dashboardController.getCustomerReminders);

// ---------------- Vendor Invoice ------------------
router.get('/vendors/remaining', dashboardController.getVendorRemaining);
router.get('/vendors/paid', dashboardController.getVendorPaid);
router.get('/vendors/reminders', dashboardController.getVendorReminders);

// ---------------- Brokers -------------------------
router.get('/brokers/remaining', dashboardController.getBrokerRemaining);
router.get('/brokers/paid', dashboardController.getBrokerPaid);
router.get('/brokers/reminders', dashboardController.getBrokerReminders);

// ---------------- Commissioners -------------------
router.get('/commissioners/remaining', dashboardController.getCommissionerRemaining);
router.get('/commissioners/paid', dashboardController.getCommissionerPaid);
router.get('/commissioners/reminders', dashboardController.getCommissionerReminders);

// --------------- Circulating Supply ---------------
router.get('/circulating-supply', dashboardController.getCirculatingSupply);

module.exports = router; 