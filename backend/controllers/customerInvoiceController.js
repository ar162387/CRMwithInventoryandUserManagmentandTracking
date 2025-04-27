const CustomerInvoice = require('../models/CustomerInvoice');
const Item = require('../models/Item');
const Broker = require('../models/Broker');
const mongoose = require('mongoose');
const { logActivity } = require('../utils/activityLogger');

// Create a new customer invoice
exports.createCustomerInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      customerId,
      customerName,
      brokerId,
      brokerName,
      brokerCommissionPercentage,
      invoiceDate,
      dueDate,
      items,
      labourTransportCost,
      paidAmount,
    } = req.body;

    // Validate due date if provided
    if (dueDate && new Date(dueDate) <= new Date(invoiceDate)) {
      return res.status(400).json({ message: 'Due date must be greater than invoice date' });
    }

    // Create a new invoice with initial payment if provided
    const invoiceData = {
      invoiceNumber,
      customerId,
      customerName,
      brokerId,
      brokerName,
      brokerCommissionPercentage: brokerCommissionPercentage || 0,
      invoiceDate,
      dueDate,
      items,
      labourTransportCost: labourTransportCost || 0,
      payments: []
    };

    // Add initial payment if provided
    if (paidAmount && parseFloat(paidAmount) > 0) {
      invoiceData.payments.push({
        amount: parseFloat(paidAmount),
        paymentMethod: 'cash',
        paymentDate: new Date()
      });
    }

    const newInvoice = new CustomerInvoice(invoiceData);

    // Calculate the broker commission amount
    if (brokerName && brokerCommissionPercentage > 0) {
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const total = subtotal + (labourTransportCost || 0);
      newInvoice.brokerCommissionAmount = Math.round((total * brokerCommissionPercentage) / 100);
    }

    // Update inventory for each item
    for (const item of items) {
      if (item.itemId) {
        const inventoryItem = await Item.findById(item.itemId);

        if (!inventoryItem) {
          throw new Error(`Item with ID ${item.itemId} not found`);
        }

        // Check if we have enough inventory
        if (
          inventoryItem.shopQuantity < item.quantity ||
          inventoryItem.shopNetWeight < item.netWeight ||
          inventoryItem.shopGrossWeight < item.grossWeight
        ) {
          throw new Error(`Not enough inventory for item ${inventoryItem.itemName}`);
        }

        // Update inventory levels
        inventoryItem.shopQuantity -= item.quantity;
        inventoryItem.shopNetWeight -= item.netWeight;
        inventoryItem.shopGrossWeight -= item.grossWeight;

        await inventoryItem.save();
      }
    }

    // Save the invoice
    await newInvoice.save();

    // Recalculate broker's totalCommission if a broker was involved
    if (brokerId) {
      await recalculateBrokerTotalCommission(brokerId);
    }

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Create Customer Invoice',
        details: {
          invoiceNumber: newInvoice.invoiceNumber,
          subtotal: newInvoice.subtotal,
          total: newInvoice.total
        }
      });
      console.log('Activity logged successfully for customer invoice creation');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error creating customer invoice:', error);
    res.status(400).json({ message: error.message || 'Failed to create invoice' });
  }
};

// Get all customer invoices
exports.getAllCustomerInvoices = async (req, res) => {
  try {
    const invoices = await CustomerInvoice.find()
      .sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
};

// Get a customer invoice by ID
exports.getCustomerInvoiceById = async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
};

// Update a customer invoice
exports.updateCustomerInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get the current invoice before updating
    const currentInvoice = await CustomerInvoice.findById(id);
    if (!currentInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Store original values for logging
    const originalSubtotal = currentInvoice.subtotal;
    const originalTotal = currentInvoice.total;

    const updatedInvoice = await CustomerInvoice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Customer Invoice',
        details: {
          invoiceNumber: updatedInvoice.invoiceNumber,
          previousSubtotal: originalSubtotal,
          previousTotal: originalTotal,
          newSubtotal: updatedInvoice.subtotal,
          newTotal: updatedInvoice.total
        }
      });
      console.log('Activity logged successfully for customer invoice update');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(400).json({ message: 'Error updating invoice', error: error.message });
  }
};

// Update a customer invoice with inventory adjustments
exports.updateCustomerInvoiceWithInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerId,
      customerName,
      brokerId,
      brokerName,
      brokerCommissionPercentage,
      invoiceDate,
      dueDate,
      items,
      originalItems,
      labourTransportCost,
      brokerCommissionAmount,
      subtotal,
      total,
      remainingAmount
    } = req.body;

    // First, find the invoice to update
    const invoice = await CustomerInvoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Store original values for logging
    const originalSubtotal = invoice.subtotal;
    const originalTotal = invoice.total;

    // Validate due date if provided
    if (dueDate && new Date(dueDate) <= new Date(invoiceDate)) {
      return res.status(400).json({ message: 'Due date must be greater than invoice date' });
    }

    // Store the original broker ID to recalculate its commissions later if needed
    const originalBrokerId = invoice.brokerId ? invoice.brokerId.toString() : null;

    // 1. Handle inventory adjustments

    // First, return the original items to inventory (add back)
    if (originalItems && Array.isArray(originalItems)) {
      for (const item of originalItems) {
        if (item.itemId) {
          const inventoryItem = await Item.findById(item.itemId);
          if (inventoryItem) {
            // Add the item quantities back to inventory
            inventoryItem.shopQuantity += parseFloat(item.quantity || 0);
            inventoryItem.shopNetWeight += parseFloat(item.netWeight || 0);
            inventoryItem.shopGrossWeight += parseFloat(item.grossWeight || 0);
            await inventoryItem.save();
          }
        }
      }
    }

    // Then, subtract the new items from inventory
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.itemId) {
          const inventoryItem = await Item.findById(item.itemId);
          if (!inventoryItem) {
            return res.status(404).json({ message: `Item with ID ${item.itemId} not found` });
          }

          // Validate that we have enough inventory
          if (
            inventoryItem.shopQuantity < parseFloat(item.quantity || 0) ||
            inventoryItem.shopNetWeight < parseFloat(item.netWeight || 0) ||
            inventoryItem.shopGrossWeight < parseFloat(item.grossWeight || 0)
          ) {
            return res.status(400).json({
              message: `Not enough inventory for item ${inventoryItem.itemName}. Available: Qty=${inventoryItem.shopQuantity}, Net=${inventoryItem.shopNetWeight}, Gross=${inventoryItem.shopGrossWeight}`
            });
          }

          // Subtract the new quantities from inventory
          inventoryItem.shopQuantity -= parseFloat(item.quantity || 0);
          inventoryItem.shopNetWeight -= parseFloat(item.netWeight || 0);
          inventoryItem.shopGrossWeight -= parseFloat(item.grossWeight || 0);
          await inventoryItem.save();
        }
      }
    }

    // 3. Update the invoice
    invoice.customerId = customerId;
    invoice.customerName = customerName;
    invoice.brokerId = brokerId;
    invoice.brokerName = brokerName;
    invoice.brokerCommissionPercentage = parseFloat(brokerCommissionPercentage || 0);
    invoice.brokerCommissionAmount = parseFloat(brokerCommissionAmount || 0);
    invoice.invoiceDate = new Date(invoiceDate);
    invoice.dueDate = dueDate ? new Date(dueDate) : null;
    invoice.items = items;
    invoice.labourTransportCost = parseFloat(labourTransportCost || 0);
    invoice.subtotal = parseFloat(subtotal || 0);
    invoice.total = parseFloat(total || 0);
    invoice.remainingAmount = parseFloat(remainingAmount || 0);

    // Recalculate status based on the new values
    if (invoice.remainingAmount <= 0) {
      invoice.status = 'paid';
    } else if (invoice.remainingAmount > 0 && invoice.dueDate && new Date() > invoice.dueDate) {
      invoice.status = 'overdue';
    } else if (invoice.totalPaidAmount > 0 && invoice.remainingAmount > 0) {
      invoice.status = 'partial';
    } else {
      invoice.status = 'unpaid';
    }

    // Save the updated invoice
    const updatedInvoice = await invoice.save();

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Customer Invoice',
        details: {
          invoiceNumber: updatedInvoice.invoiceNumber,
          previousSubtotal: originalSubtotal,
          previousTotal: originalTotal,
          newSubtotal: updatedInvoice.subtotal,
          newTotal: updatedInvoice.total
        }
      });
      console.log('Activity logged successfully for customer invoice update with inventory');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    // Recalculate totalCommission for the brokers involved
    // If broker was changed, recalculate for both old and new broker
    if (originalBrokerId) {
      await recalculateBrokerTotalCommission(originalBrokerId);
    }

    if (brokerId && (!originalBrokerId || brokerId !== originalBrokerId)) {
      await recalculateBrokerTotalCommission(brokerId);
    }

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice with inventory:', error);
    res.status(400).json({ message: error.message || 'Failed to update invoice with inventory' });
  }
};

// Delete a customer invoice
exports.deleteCustomerInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the invoice to check if there's a broker involved and to access items
    const invoice = await CustomerInvoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Store invoice details for logging
    const invoiceNumber = invoice.invoiceNumber;
    const subtotal = invoice.subtotal;
    const total = invoice.total;

    // Store broker ID before deleting the invoice
    const brokerId = invoice.brokerId;

    // Return all items in the invoice back to inventory
    if (invoice.items && Array.isArray(invoice.items)) {
      for (const item of invoice.items) {
        if (item.itemId) {
          const inventoryItem = await Item.findById(item.itemId);
          if (inventoryItem) {
            // Add the item quantities back to inventory
            inventoryItem.shopQuantity += parseFloat(item.quantity || 0);
            inventoryItem.shopNetWeight += parseFloat(item.netWeight || 0);
            inventoryItem.shopGrossWeight += parseFloat(item.grossWeight || 0);
            await inventoryItem.save();
          }
        }
      }
    }

    // Now delete the invoice
    const deletedInvoice = await CustomerInvoice.findByIdAndDelete(id);

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Delete Customer Invoice',
        details: {
          invoiceNumber: invoiceNumber,
          subtotal: subtotal,
          total: total
        }
      });
      console.log('Activity logged successfully for invoice deletion');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    // If this invoice had a broker, recalculate broker commission
    if (brokerId) {
      await recalculateBrokerTotalCommission(brokerId);
    }

    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Error deleting invoice', error: error.message });
  }
};

// Add a payment to a customer invoice
exports.addPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDate } = req.body;
    const invoiceId = req.params.id;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const payment = {
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'cash',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date()
    };

    const invoice = await CustomerInvoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Add payment
    invoice.payments.push(payment);

    // Recalculate totals and status
    invoice.totalPaidAmount = invoice.payments.reduce(
      (sum, payment) => sum + payment.amount, 0
    );
    invoice.remainingAmount = invoice.total - invoice.totalPaidAmount;

    // Update status
    if (invoice.remainingAmount <= 0) {
      invoice.status = 'paid';
    } else if (invoice.remainingAmount > 0 && invoice.dueDate &&
      new Date() > new Date(invoice.dueDate)) {
      invoice.status = 'overdue';
    } else if (invoice.totalPaidAmount > 0 && invoice.remainingAmount > 0) {
      invoice.status = 'partial';
    } else {
      invoice.status = 'unpaid';
    }

    const updatedInvoice = await invoice.save();

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Customer Invoice Payment',
        details: {
          invoiceNumber: updatedInvoice.invoiceNumber,
          paymentAmount: parseFloat(amount)
        }
      });
      console.log('Activity logged successfully for payment update');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    // If this invoice has a broker, recalculate the broker's totalCommission
    if (updatedInvoice.brokerId) {
      await recalculateBrokerTotalCommission(updatedInvoice.brokerId);
    }

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(400).json({ message: error.message || 'Failed to add payment' });
  }
};

// Update customer invoice due date
exports.updateDueDate = async (req, res) => {
  try {
    const { dueDate } = req.body;
    const invoiceId = req.params.id;

    if (!dueDate) {
      return res.status(400).json({ message: 'Due date is required' });
    }

    const invoice = await CustomerInvoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Update due date
    invoice.dueDate = new Date(dueDate);

    // Update status based on new due date
    if (invoice.remainingAmount <= 0) {
      invoice.status = 'paid';
    } else if (invoice.remainingAmount > 0 && invoice.dueDate &&
      new Date() > new Date(invoice.dueDate)) {
      invoice.status = 'overdue';
    } else if (invoice.totalPaidAmount > 0 && invoice.remainingAmount > 0) {
      invoice.status = 'partial';
    } else {
      invoice.status = 'unpaid';
    }

    const updatedInvoice = await invoice.save();

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Customer Invoice Due Date',
        details: {
          invoiceNumber: updatedInvoice.invoiceNumber,
          dueDate: dueDate
        }
      });
      console.log('Activity logged successfully for due date update');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    // If this invoice has a broker, we should recalculate their commission
    // For due date changes, this is not strictly necessary but ensures data consistency
    if (updatedInvoice.brokerId) {
      await recalculateBrokerTotalCommission(updatedInvoice.brokerId);
    }

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error updating due date:', error);
    res.status(400).json({ message: error.message || 'Failed to update due date' });
  }
};

// Get invoices by customer ID
exports.getInvoicesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    const invoices = await CustomerInvoice.find({ customerId })
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({
      message: 'Error fetching customer invoices',
      error: error.message
    });
  }
};

// Helper function to recalculate a broker's totalCommission from all invoices
async function recalculateBrokerTotalCommission(brokerId) {
  try {
    if (!brokerId) return;

    // Find all invoices for this broker
    const brokerInvoices = await CustomerInvoice.find({ brokerId: brokerId });

    // Calculate total commission from all invoices
    const totalCommission = brokerInvoices.reduce((sum, invoice) =>
      sum + (invoice.brokerCommissionAmount || 0), 0);

    // Update the broker document
    const broker = await Broker.findById(brokerId);
    if (broker) {
      broker.totalCommission = Math.round(totalCommission);
      broker.totalRemaining = broker.totalCommission - broker.totalPaid;
      await broker.save();
    }
  } catch (error) {
    console.error('Error recalculating broker commission:', error);
    throw error;
  }
} 