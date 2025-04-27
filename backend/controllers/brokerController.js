const Broker = require('../models/Broker');
const { logActivity } = require('../utils/activityLogger');
const CustomerInvoice = require('../models/CustomerInvoice');

// Helper function for logging broker activities
const logBrokerActivity = async (req, action, details) => {
  try {
    if (!req.user || !req.user._id) {
      console.warn('User information not available for activity logging');
      return;
    }

    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      action,
      details
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Helper function to calculate broker's commission and update status
const calculateBrokerCommission = async (brokerId) => {
  try {
    // Find all customer invoices for this broker
    const customerInvoices = await CustomerInvoice.find({ brokerId });

    // Calculate total commission in real-time
    const totalCommission = customerInvoices.reduce(
      (sum, invoice) => sum + (parseFloat(invoice.brokerCommissionAmount) || 0),
      0
    );

    // Get broker data
    const broker = await Broker.findById(brokerId);
    if (!broker) return null;

    // Update totalCommission on the broker document
    broker.totalCommission = Math.round(totalCommission);

    // The pre-save hook in the Broker model will handle:
    // - Calculating totalPaid from payments
    // - Ensuring totalCommission is a valid number
    // - Calculating totalRemaining = max(0, totalCommission - totalPaid)
    // - Setting the correct status based on these values

    await broker.save();

    return {
      broker,
      totalCommission: Math.round(totalCommission)
    };
  } catch (error) {
    console.error('Error calculating broker commission:', error);
    return null;
  }
};

// Get all brokers
exports.getAllBrokers = async (req, res) => {
  try {
    const brokers = await Broker.find().sort({ createdAt: -1 });

    // Enhanced response with calculated commission
    const enhancedBrokers = await Promise.all(
      brokers.map(async broker => {
        const result = await calculateBrokerCommission(broker._id);
        return {
          ...broker.toObject(),
          totalCommission: result ? result.totalCommission : 0
        };
      })
    );

    res.json(enhancedBrokers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single broker
exports.getBroker = async (req, res) => {
  try {
    const broker = await Broker.findById(req.params.id);
    if (!broker) {
      return res.status(404).json({ message: 'Broker not found' });
    }

    // Calculate commission in real-time
    const result = await calculateBrokerCommission(broker._id);
    if (!result) {
      return res.status(500).json({ message: 'Error calculating broker commission' });
    }

    // Return broker with calculated commission
    const brokerData = broker.toObject();
    brokerData.totalCommission = result.totalCommission;

    res.json(brokerData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new broker
exports.createBroker = async (req, res) => {
  try {
    const broker = new Broker(req.body);
    const savedBroker = await broker.save();

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Create Broker',
        details: {
          brokerId: savedBroker._id,
          brokerName: savedBroker.brokerName
        }
      });
    }

    res.status(201).json(savedBroker);
  } catch (error) {
    console.error('Error in createBroker:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(400).json({
      message: 'Error creating broker',
      error: error.message
    });
  }
};

// Update broker
exports.updateBroker = async (req, res) => {
  try {
    const broker = await Broker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!broker) {
      return res.status(404).json({ message: 'Broker not found' });
    }

    // Calculate commission in real-time after update
    const result = await calculateBrokerCommission(broker._id);
    if (!result) {
      return res.status(500).json({ message: 'Error calculating broker commission' });
    }

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Broker',
        details: {
          brokerId: broker._id,
          brokerName: broker.brokerName
        }
      });
    }

    // Return broker with calculated commission
    const brokerData = broker.toObject();
    brokerData.totalCommission = result.totalCommission;

    res.json(brokerData);
  } catch (error) {
    console.error('Error in updateBroker:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete broker
exports.deleteBroker = async (req, res) => {
  try {
    const broker = await Broker.findById(req.params.id);
    if (!broker) {
      return res.status(404).json({ message: 'Broker not found' });
    }

    // Calculate commission to check remaining balance
    const result = await calculateBrokerCommission(broker._id);
    if (result && result.broker.totalRemaining !== 0) {
      return res.status(400).json({
        message: 'Cannot delete broker with remaining balance'
      });
    }

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Delete Broker',
        details: {
          brokerId: broker._id,
          brokerName: broker.brokerName
        }
      });
    }

    await Broker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Broker deleted successfully' });
  } catch (error) {
    console.error('Error in deleteBroker:', error);
    res.status(500).json({ message: error.message });
  }
};

// Search brokers
exports.searchBrokers = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const brokers = await Broker.find({
      $or: [
        { brokerName: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    // Enhanced response with calculated commission
    const enhancedBrokers = await Promise.all(
      brokers.map(async broker => {
        const result = await calculateBrokerCommission(broker._id);
        return {
          ...broker.toObject(),
          totalCommission: result ? result.totalCommission : 0
        };
      })
    );

    res.json(enhancedBrokers);
  } catch (error) {
    console.error('Error in searchBrokers:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add payment to broker
exports.addPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDate } = req.body;
    const brokerId = req.params.id;

    // Validate the amount - must be a whole number
    if (!amount || amount <= 0 || !Number.isInteger(Number(amount))) {
      return res.status(400).json({ message: 'Payment amount must be a positive whole number' });
    }

    const broker = await Broker.findById(brokerId);
    if (!broker) {
      return res.status(404).json({ message: 'Broker not found' });
    }

    // Calculate commission in real-time
    const result = await calculateBrokerCommission(broker._id);
    if (!result) {
      return res.status(500).json({ message: 'Error calculating broker commission' });
    }

    // Check if payment exceeds remaining amount
    if (amount > result.broker.totalRemaining) {
      return res.status(400).json({
        message: 'Payment amount cannot exceed the remaining amount',
        totalRemaining: result.broker.totalRemaining
      });
    }

    // Create payment object
    const payment = {
      amount: Math.round(Number(amount)), // Ensure it's a whole number
      paymentMethod: paymentMethod || 'cash',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date()
    };

    // Add payment to broker's payments array
    broker.payments.push(payment);

    // Save broker and recalculate
    await broker.save();
    const updatedResult = await calculateBrokerCommission(broker._id);

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Add Broker Payment',
        details: {
          brokerId: broker._id,
          brokerName: broker.brokerName,
          paymentAmount: payment.amount,
          paymentMethod: payment.paymentMethod
        }
      });
    }

    // Return broker with calculated commission
    const brokerData = updatedResult.broker.toObject();
    brokerData.totalCommission = updatedResult.totalCommission;

    res.status(200).json(brokerData);
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(400).json({ message: error.message || 'Failed to add payment' });
  }
};

// Update broker due date
exports.updateDueDate = async (req, res) => {
  try {
    const { dueDate } = req.body;
    const brokerId = req.params.id;

    const broker = await Broker.findById(brokerId);
    if (!broker) {
      return res.status(404).json({ message: 'Broker not found' });
    }

    // Update due date (can be null/undefined to clear the due date)
    broker.dueDate = dueDate ? new Date(dueDate) : null;

    // Save and recalculate status based on new due date
    await broker.save();
    const result = await calculateBrokerCommission(broker._id);

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Broker Due Date',
        details: {
          brokerId: broker._id,
          brokerName: broker.brokerName,
          dueDate: broker.dueDate
        }
      });
    }

    // Return broker with calculated commission
    const brokerData = result.broker.toObject();
    brokerData.totalCommission = result.totalCommission;

    res.status(200).json(brokerData);
  } catch (error) {
    console.error('Error updating due date:', error);
    res.status(400).json({ message: error.message || 'Failed to update due date' });
  }
};

// Get broker invoices - retrieves all customer invoices for a specific broker
exports.getBrokerInvoices = async (req, res) => {
  try {
    const brokerId = req.params.id;

    // Find all customer invoices where brokerId matches
    const invoices = await CustomerInvoice.find({
      brokerId: brokerId
    }).sort({ invoiceDate: -1 });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching broker invoices:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get broker summary with total commissions, paid, and remaining
exports.getBrokerSummary = async (req, res) => {
  try {
    // Get summary for all brokers if no ID is provided
    if (!req.params.id || req.params.id === 'all') {
      const customerInvoices = await CustomerInvoice.find();

      // Calculate totals from all invoices
      const totalCommission = customerInvoices.reduce((sum, invoice) =>
        sum + (invoice.brokerCommissionAmount || 0), 0);

      // Get all brokers to calculate total paid
      const brokers = await Broker.find();
      const totalPaid = brokers.reduce((sum, broker) => sum + broker.totalPaid, 0);

      return res.json({
        totalCommission: Math.round(totalCommission),
        totalPaid: Math.round(totalPaid),
        totalRemaining: Math.round(totalCommission - totalPaid)
      });
    }

    // Get summary for a specific broker
    const broker = await Broker.findById(req.params.id);
    if (!broker) {
      return res.status(404).json({ message: 'Broker not found' });
    }

    // Calculate commission in real-time
    const result = await calculateBrokerCommission(broker._id);
    if (!result) {
      return res.status(500).json({ message: 'Error calculating broker commission' });
    }

    res.json({
      brokerId: broker._id,
      brokerName: broker.brokerName,
      totalCommission: result.totalCommission,
      totalPaid: broker.totalPaid,
      totalRemaining: broker.totalRemaining,
      dueDate: broker.dueDate,
      status: broker.status
    });
  } catch (error) {
    console.error('Error getting broker summary:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to recalculate a broker's totalCommission from all invoices
const recalculateBrokerTotalCommission = async (brokerId) => {
  try {
    if (!brokerId) return;

    // Find all invoices for this broker
    const brokerInvoices = await CustomerInvoice.find({ brokerId: brokerId });

    // Calculate total commission from all invoices
    const totalCommission = brokerInvoices.reduce((sum, invoice) =>
      sum + (parseFloat(invoice.brokerCommissionAmount) || 0), 0);

    // Update the broker document with the new totalCommission
    const broker = await Broker.findById(brokerId);
    if (broker) {
      broker.totalCommission = Math.round(totalCommission);

      // The pre-save hook will handle:
      // - Calculating totalPaid from payments
      // - Ensuring totalRemaining is non-negative
      // - Updating the status based on these values

      await broker.save();

      // Log a warning if there's a payment excess
      if (broker.totalPaid > broker.totalCommission) {
        console.warn(`Broker ${broker.brokerName} (ID: ${brokerId}) has more paid amount (${broker.totalPaid}) than total commission (${broker.totalCommission}). Remaining amount capped at 0.`);
      }
    }
  } catch (error) {
    console.error('Error recalculating broker commission:', error);
    throw error;
  }
}; 