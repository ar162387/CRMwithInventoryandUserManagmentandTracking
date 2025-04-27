const express = require('express');
const router = express.Router();
const commissionerController = require('../controllers/commissionerController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Search commissioners (must come before /:id routes)
router.get('/search', commissionerController.searchCommissioners);

// Commissioner CRUD routes
router.post('/', commissionerController.createCommissioner);
router.get('/', commissionerController.getAllCommissioners);
router.get('/:id', commissionerController.getCommissioner);
router.put('/:id', commissionerController.updateCommissioner);
router.delete('/:id', commissionerController.deleteCommissioner);

// Payment routes
router.post('/:id/payments', commissionerController.addPayment);
router.post('/:id/due-date', commissionerController.setDueDate);

module.exports = router; 