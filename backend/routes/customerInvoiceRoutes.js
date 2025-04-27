const express = require('express');
const router = express.Router();
const customerInvoiceController = require('../controllers/customerInvoiceController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new customer invoice
router.post('/', customerInvoiceController.createCustomerInvoice);

// Get all customer invoices
router.get('/', customerInvoiceController.getAllCustomerInvoices);

// Get invoices by customer ID
router.get('/customer/:customerId', customerInvoiceController.getInvoicesByCustomer);

// Get a specific customer invoice
router.get('/:id', customerInvoiceController.getCustomerInvoiceById);

// Update a customer invoice
router.put('/:id', customerInvoiceController.updateCustomerInvoice);

// Update a customer invoice with inventory adjustments
router.put('/:id/with-inventory', customerInvoiceController.updateCustomerInvoiceWithInventory);

// Delete a customer invoice
router.delete('/:id', customerInvoiceController.deleteCustomerInvoice);

// Add a payment to a customer invoice
router.post('/:id/payments', customerInvoiceController.addPayment);

// Update due date for a customer invoice
router.patch('/:id/due-date', customerInvoiceController.updateDueDate);

module.exports = router; 