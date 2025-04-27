const Commissioner = require('../models/Commissioner');
const { logActivity } = require('../utils/activityLogger');
const CommissionerInvoice = require('../models/CommissionerInvoice');

// Get all commissioners
exports.getAllCommissioners = async (req, res) => {
  try {
    const commissioners = await Commissioner.find({})
      .sort({ commissionerName: 1 });
    res.status(200).json(commissioners);
  } catch (error) {
    console.error('Error fetching commissioners:', error);
    res.status(500).json({
      message: 'Failed to fetch commissioners',
      error: error.message
    });
  }
};

// Get single commissioner
exports.getCommissioner = async (req, res) => {
  try {
    const commissioner = await Commissioner.findById(req.params.id);
    if (!commissioner) {
      return res.status(404).json({ message: 'Commissioner not found' });
    }
    res.json(commissioner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new commissioner
exports.createCommissioner = async (req, res) => {
  try {
    const commissionerData = req.body;
    const commissioner = new Commissioner(commissionerData);
    const savedCommissioner = await commissioner.save();

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Create Commissioner',
        details: {
          commissionerId: savedCommissioner._id,
          commissionerName: savedCommissioner.commissionerName,
          phone: savedCommissioner.phone,
          city: savedCommissioner.city
        }
      });
      console.log('Activity logged successfully for commissioner creation');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(201).json(savedCommissioner);
  } catch (error) {
    console.error('Error creating commissioner:', error);
    res.status(500).json({
      message: 'Failed to create commissioner',
      error: error.message
    });
  }
};

// Update commissioner
exports.updateCommissioner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get the original commissioner data for comparison
    const originalCommissioner = await Commissioner.findById(id);

    if (!originalCommissioner) {
      return res.status(404).json({ message: 'Commissioner not found' });
    }

    const updatedCommissioner = await Commissioner.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Commissioner',
        details: {
          commissionerId: updatedCommissioner._id,
          commissionerName: updatedCommissioner.commissionerName,
          previousName: originalCommissioner.commissionerName,
          previousPhone: originalCommissioner.phone,
          newPhone: updatedCommissioner.phone,
          previousCity: originalCommissioner.city,
          newCity: updatedCommissioner.city
        }
      });
      console.log('Activity logged successfully for commissioner update');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(200).json(updatedCommissioner);
  } catch (error) {
    console.error('Error updating commissioner:', error);
    res.status(500).json({
      message: 'Failed to update commissioner',
      error: error.message
    });
  }
};

// Delete commissioner
exports.deleteCommissioner = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are any invoices associated with this commissioner
    const invoiceCount = await CommissionerInvoice.countDocuments({ commissionerId: id });

    if (invoiceCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete commissioner with associated invoices',
        invoiceCount
      });
    }

    const deletedCommissioner = await Commissioner.findById(id);

    if (!deletedCommissioner) {
      return res.status(404).json({ message: 'Commissioner not found' });
    }

    // Now delete the commissioner
    await Commissioner.findByIdAndDelete(id);

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Delete Commissioner',
        details: {
          commissionerId: deletedCommissioner._id,
          commissionerName: deletedCommissioner.commissionerName,
          phone: deletedCommissioner.phone,
          city: deletedCommissioner.city,
          totalCommission: deletedCommissioner.totalCommission,
          totalPaid: deletedCommissioner.totalPaid
        }
      });
      console.log('Activity logged successfully for commissioner deletion');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(200).json({ message: 'Commissioner deleted successfully' });
  } catch (error) {
    console.error('Error deleting commissioner:', error);
    res.status(500).json({
      message: 'Failed to delete commissioner',
      error: error.message
    });
  }
};

// Search commissioners
exports.searchCommissioners = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const commissioners = await Commissioner.find({
      $or: [
        { commissionerName: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json(commissioners);
  } catch (error) {
    console.error('Error in searchCommissioners:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add a payment to a commissioner
exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, paymentDate } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }

    const commissioner = await Commissioner.findById(id);

    if (!commissioner) {
      return res.status(404).json({ message: 'Commissioner not found' });
    }

    // Capture previous payment total for logging
    const previousTotalPaid = commissioner.totalPaid || 0;

    // Add the payment
    commissioner.payments.push({
      amount,
      paymentMethod: paymentMethod || 'cash',
      paymentDate: paymentDate || new Date()
    });

    const updatedCommissioner = await commissioner.save();

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Add Commissioner Payment',
        details: {
          commissionerId: updatedCommissioner._id,
          commissionerName: updatedCommissioner.commissionerName,
          paymentAmount: amount,
          paymentMethod: paymentMethod || 'cash',
          paymentDate: paymentDate || new Date(),
          previousTotalPaid: previousTotalPaid,
          newTotalPaid: updatedCommissioner.totalPaid || 0,
          remainingAmount: updatedCommissioner.totalRemaining || 0
        }
      });
      console.log('Activity logged successfully for commissioner payment');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(200).json(updatedCommissioner);
  } catch (error) {
    console.error('Error adding payment to commissioner:', error);
    res.status(500).json({
      message: 'Failed to add payment to commissioner',
      error: error.message
    });
  }
};

// Set due date for a commissioner
exports.setDueDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { dueDate } = req.body;

    if (!dueDate) {
      return res.status(400).json({ message: 'Due date is required' });
    }

    const commissioner = await Commissioner.findById(id);

    if (!commissioner) {
      return res.status(404).json({ message: 'Commissioner not found' });
    }

    // Store previous due date and status for logging
    const previousDueDate = commissioner.dueDate;
    const previousStatus = commissioner.status;

    commissioner.dueDate = new Date(dueDate);

    // Also update the status based on the new due date
    if (commissioner.totalRemaining > 0) {
      if (new Date() > new Date(dueDate)) {
        commissioner.status = 'overdue';
      } else if (commissioner.totalPaid > 0) {
        commissioner.status = 'partial';
      } else {
        commissioner.status = 'unpaid';
      }
    }

    const updatedCommissioner = await commissioner.save();

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Set Commissioner Due Date',
        details: {
          commissionerId: updatedCommissioner._id,
          commissionerName: updatedCommissioner.commissionerName,
          previousDueDate: previousDueDate ? new Date(previousDueDate) : null,
          newDueDate: new Date(dueDate),
          previousStatus: previousStatus || 'N/A',
          newStatus: updatedCommissioner.status || 'N/A',
          totalRemaining: updatedCommissioner.totalRemaining || 0
        }
      });
      console.log('Activity logged successfully for commissioner due date update');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(200).json(updatedCommissioner);
  } catch (error) {
    console.error('Error setting due date for commissioner:', error);
    res.status(500).json({
      message: 'Failed to set due date for commissioner',
      error: error.message
    });
  }
}; 