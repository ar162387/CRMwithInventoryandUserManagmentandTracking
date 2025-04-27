const express = require('express');
const router = express.Router();
const vendorInvoiceController = require('../controllers/vendorInvoiceController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Middleware to log incoming requests
router.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  if (req.method === 'PUT' || req.method === 'POST') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Create a new vendor invoice
router.post('/', vendorInvoiceController.createVendorInvoice);

// Get all vendor invoices
router.get('/', vendorInvoiceController.getVendorInvoices);

// Search vendor invoices
router.get('/search', vendorInvoiceController.searchVendorInvoices);

// Get vendor invoices by vendor ID
router.get('/vendor/:vendorId', vendorInvoiceController.getVendorInvoicesByVendor);

// Get a specific vendor invoice by ID
router.get('/:id', vendorInvoiceController.getVendorInvoiceById);

// Update vendor invoice payment
router.patch('/:id/payment', vendorInvoiceController.updateVendorInvoicePayment);

// Update a vendor invoice
router.put('/:id', vendorInvoiceController.updateVendorInvoice);

// Delete a vendor invoice
router.delete('/:id', vendorInvoiceController.deleteVendorInvoice);

module.exports = router; 