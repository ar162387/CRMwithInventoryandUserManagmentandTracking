const CommissionerInvoice = require('../models/CommissionerInvoice');
const Commissioner = require('../models/Commissioner');
const mongoose = require('mongoose');
const { logActivity } = require('../utils/activityLogger');

/**
 * Create a new commissioner invoice
 */
exports.createCommissionerInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    // Create the invoice with the provided data
    const invoice = new CommissionerInvoice(invoiceData);

    // Save the invoice
    const savedInvoice = await invoice.save();

    // If a commissioner is associated with the invoice and there's a paid amount,
    // update the commissioner's payment and commission details
    if (savedInvoice.commissionerId && savedInvoice.paidAmount > 0) {
      const commissioner = await Commissioner.findById(savedInvoice.commissionerId);

      if (commissioner) {
        // Add the payment to the commissioner's payments array
        commissioner.payments.push({
          amount: savedInvoice.paidAmount,
          paymentMethod: 'cash', // Default as per requirements
          paymentDate: new Date()
        });

        // Update the commissioner's total commission by adding this invoice's commissioner amount
        commissioner.totalCommission += savedInvoice.commissionerAmount;

        // Save the updated commissioner
        await commissioner.save();
      }
    }

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Create Commissioner Invoice',
        details: {
          invoiceNumber: savedInvoice.invoiceNumber,
          commissionerName: savedInvoice.commissionerName,
          commissionerAmount: savedInvoice.commissionerAmount,
          paidAmount: savedInvoice.paidAmount
        }
      });
      console.log('Activity logged successfully for commissioner invoice creation');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(201).json(savedInvoice);
  } catch (error) {
    console.error('Error creating commissioner invoice:', error);
    res.status(500).json({
      message: 'Failed to create commissioner invoice',
      error: error.message
    });
  }
};

/**
 * Get all commissioner invoices
 */
exports.getAllCommissionerInvoices = async (req, res) => {
  try {
    const invoices = await CommissionerInvoice.find({})
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching commissioner invoices:', error);
    res.status(500).json({
      message: 'Failed to fetch commissioner invoices',
      error: error.message
    });
  }
};

/**
 * Get commissioner invoice by ID
 */
exports.getCommissionerInvoiceById = async (req, res) => {
  try {
    const invoice = await CommissionerInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Commissioner invoice not found' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching commissioner invoice:', error);
    res.status(500).json({
      message: 'Failed to fetch commissioner invoice',
      error: error.message
    });
  }
};

/**
 * Get all invoices for a specific commissioner
 */
exports.getInvoicesByCommissioner = async (req, res) => {
  try {
    const commissionerId = req.params.commissionerId;

    const invoices = await CommissionerInvoice.find({
      commissionerId: commissionerId
    }).sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching commissioner invoices:', error);
    res.status(500).json({
      message: 'Failed to fetch commissioner invoices',
      error: error.message
    });
  }
};

/**
 * Update a commissioner invoice
 */
exports.updateCommissionerInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Fetch the original invoice to compare changes
    const originalInvoice = await CommissionerInvoice.findById(id);
    if (!originalInvoice) {
      return res.status(404).json({ message: 'Commissioner invoice not found' });
    }

    // Update the invoice
    const updatedInvoice = await CommissionerInvoice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // If the commissioner amount or paid amount changed and there's a commissioner ID,
    // we need to update the commissioner's records
    if (
      originalInvoice.commissionerId &&
      (originalInvoice.commissionerAmount !== updatedInvoice.commissionerAmount ||
        originalInvoice.paidAmount !== updatedInvoice.paidAmount)
    ) {
      const commissioner = await Commissioner.findById(originalInvoice.commissionerId);

      if (commissioner) {
        // Update the total commission
        commissioner.totalCommission = commissioner.totalCommission - originalInvoice.commissionerAmount + updatedInvoice.commissionerAmount;

        // Handle payment changes
        if (originalInvoice.paidAmount > 0) {
          // Find and remove the original payment
          const paymentIndex = commissioner.payments.findIndex(
            p => p.amount === originalInvoice.paidAmount &&
              p.paymentDate.getTime() === new Date(originalInvoice.createdAt).getTime()
          );

          if (paymentIndex !== -1) {
            commissioner.payments.splice(paymentIndex, 1);
          }
        }

        // Add the new payment if applicable
        if (updatedInvoice.paidAmount > 0) {
          commissioner.payments.push({
            amount: updatedInvoice.paidAmount,
            paymentMethod: 'cash',
            paymentDate: new Date()
          });
        }

        // Save the updated commissioner
        await commissioner.save();
      }
    }

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Commissioner Invoice',
        details: {
          invoiceNumber: updatedInvoice.invoiceNumber,
          previousCommissionerAmount: originalInvoice.commissionerAmount,
          newCommissionerAmount: updatedInvoice.commissionerAmount,
          previousPaidAmount: originalInvoice.paidAmount,
          newPaidAmount: updatedInvoice.paidAmount
        }
      });
      console.log('Activity logged successfully for commissioner invoice update');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error updating commissioner invoice:', error);
    res.status(500).json({
      message: 'Failed to update commissioner invoice',
      error: error.message
    });
  }
};

/**
 * Delete a commissioner invoice
 */
exports.deleteCommissionerInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the invoice to get commissioner details before deletion
    const invoice = await CommissionerInvoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: 'Commissioner invoice not found' });
    }

    // If a commissioner is associated and there was a commission amount,
    // check if deletion would cause negative balance
    if (invoice.commissionerId && invoice.commissionerAmount > 0) {
      const commissioner = await Commissioner.findById(invoice.commissionerId);

      if (commissioner) {
        // Calculate what would happen if we delete this invoice
        const newTotalCommission = commissioner.totalCommission - invoice.commissionerAmount;
        const newTotalPaid = commissioner.totalPaid - (invoice.paidAmount || 0);
        const newTotalRemaining = newTotalCommission - newTotalPaid;

        // Check if the deletion would cause a negative balance
        if (newTotalRemaining < 0) {
          const negativeAmount = Math.abs(newTotalRemaining);
          return res.status(400).json({
            message: `Cannot delete this invoice. It would cause a negative balance of ${negativeAmount} for ${commissioner.commissionerName}. This indicates more has been paid than the total commission after removing this invoice.`,
            negativeAmount
          });
        }
      }
    }

    // Delete the invoice
    await CommissionerInvoice.findByIdAndDelete(id);

    // If a commissioner is associated, update the commissioner's records
    if (invoice.commissionerId) {
      const commissioner = await Commissioner.findById(invoice.commissionerId);

      if (commissioner) {
        // Subtract the commission amount from the total
        commissioner.totalCommission -= invoice.commissionerAmount;

        // Remove any payment related to this invoice
        if (invoice.paidAmount > 0) {
          // First try to find a payment with the exact amount and a date close to the invoice creation date
          // We'll look for payments made on the same day as the invoice creation
          const invoiceDate = new Date(invoice.createdAt);
          const invoiceDateString = invoiceDate.toISOString().split('T')[0]; // Get YYYY-MM-DD

          let paymentIndex = commissioner.payments.findIndex(p => {
            // Check for amount match
            if (p.amount !== invoice.paidAmount) return false;

            // Check if payment was made on the same day as invoice creation
            const paymentDateString = p.paymentDate.toISOString().split('T')[0];
            return paymentDateString === invoiceDateString;
          });

          // If we couldn't find a payment with the exact criteria, just look for the amount match
          if (paymentIndex === -1) {
            console.log(`Could not find payment with exact date match for invoice ${invoice._id}. Looking for amount match only.`);
            paymentIndex = commissioner.payments.findIndex(p => p.amount === invoice.paidAmount);
          }

          if (paymentIndex !== -1) {
            // Log the payment being removed for debugging
            console.log(`Removing payment: ${JSON.stringify(commissioner.payments[paymentIndex])}`);
            commissioner.payments.splice(paymentIndex, 1);
          } else {
            console.warn(`Could not find matching payment for invoice ${invoice._id} with paid amount ${invoice.paidAmount}`);
          }
        }

        // Save the updated commissioner
        await commissioner.save();
      }
    }

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Delete Commissioner Invoice',
        details: {
          invoiceNumber: invoice.invoiceNumber,
          commissionerName: invoice.commissionerName,
          commissionerAmount: invoice.commissionerAmount,
          paidAmount: invoice.paidAmount
        }
      });
      console.log('Activity logged successfully for commissioner invoice deletion');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(200).json({ message: 'Commissioner invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting commissioner invoice:', error);
    res.status(500).json({
      message: 'Failed to delete commissioner invoice',
      error: error.message
    });
  }
}; 