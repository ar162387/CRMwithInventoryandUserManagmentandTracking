const express = require('express');
const router = express.Router();
const commissionerInvoiceController = require('../controllers/commissionerInvoiceController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Commissioner Invoice CRUD routes
router.post('/', commissionerInvoiceController.createCommissionerInvoice);
router.get('/', commissionerInvoiceController.getAllCommissionerInvoices);
router.get('/:id', commissionerInvoiceController.getCommissionerInvoiceById);
router.put('/:id', commissionerInvoiceController.updateCommissionerInvoice);
router.delete('/:id', commissionerInvoiceController.deleteCommissionerInvoice);

// Get invoices by commissioner
router.get('/commissioner/:commissionerId', commissionerInvoiceController.getInvoicesByCommissioner);

module.exports = router; 