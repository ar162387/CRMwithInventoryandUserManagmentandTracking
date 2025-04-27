const Balance = require('../models/Balance');
const { logActivity } = require('../utils/activityLogger');

// Helper function for logging balance activities
const logBalanceActivity = async (req, action, details) => {
  try {
    if (!req.user || !req.user.id) {
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

// Get total balance
exports.getTotalBalance = async (req, res) => {
  try {
    // Aggregate to calculate total balance
    const result = await Balance.aggregate([
      {
        $group: {
          _id: null,
          totalAdditions: {
            $sum: {
              $cond: [{ $eq: ["$type", "addition"] }, "$amount", 0]
            }
          },
          totalSubtractions: {
            $sum: {
              $cond: [{ $eq: ["$type", "subtraction"] }, "$amount", 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalBalance: { $subtract: ["$totalAdditions", "$totalSubtractions"] }
        }
      }
    ]);

    const totalBalance = result.length > 0 ? result[0].totalBalance : 0;

    res.json({ totalBalance });
  } catch (error) {
    console.error('Error calculating total balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all balance entries with pagination and sorting
exports.getAllBalanceEntries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter params
    const dateFilter = req.query.date ? new Date(req.query.date) : null;
    const remarksFilter = req.query.remarks || null;

    // Build filter object
    const filter = {};
    if (dateFilter) {
      const startDate = new Date(dateFilter);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(dateFilter);
      endDate.setHours(23, 59, 59, 999);

      filter.date = { $gte: startDate, $lte: endDate };
    }

    if (remarksFilter) {
      filter.remarks = { $regex: remarksFilter, $options: 'i' };
    }

    // Get total count for pagination
    const total = await Balance.countDocuments(filter);

    // Get entries
    const entries = await Balance.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'username fullname');

    res.json({
      entries,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching balance entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a balance entry
exports.addBalanceEntry = async (req, res) => {
  try {
    const { amount, date, remarks, type } = req.body;

    if (!amount || !date || !remarks || !type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Ensure amount is a non-zero number
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    // Create new entry
    const newEntry = new Balance({
      amount,
      date: new Date(date),
      remarks,
      type,
      createdBy: req.user.id
    });

    const savedEntry = await newEntry.save();

    // Log activity with more detailed information
    await logBalanceActivity(req, `Add Balance ${type}`, {
      amount,
      entryId: savedEntry._id,
      type,
      remarks
    });

    res.status(201).json(savedEntry);
  } catch (error) {
    console.error('Error adding balance entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a balance entry
exports.updateBalanceEntry = async (req, res) => {
  try {
    const { amount, date, remarks, type } = req.body;

    if (!amount || !date || !remarks || !type) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Ensure amount is a non-zero number
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    // Get the original entry before updating
    const originalEntry = await Balance.findById(req.params.id);
    if (!originalEntry) {
      return res.status(404).json({ message: 'Balance entry not found' });
    }

    const updatedEntry = await Balance.findByIdAndUpdate(
      req.params.id,
      {
        amount,
        date: new Date(date),
        remarks,
        type
      },
      { new: true }
    );

    // Log activity with more detailed information
    await logBalanceActivity(req, `Update Balance ${type}`, {
      entryId: updatedEntry._id,
      originalAmount: originalEntry.amount,
      newAmount: amount,
      originalType: originalEntry.type,
      newType: type,
      remarks
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating balance entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a balance entry
exports.deleteBalanceEntry = async (req, res) => {
  try {
    const entry = await Balance.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ message: 'Balance entry not found' });
    }

    await entry.deleteOne();

    // Log activity with more detailed information
    await logBalanceActivity(req, `Delete Balance ${entry.type}`, {
      entryId: entry._id,
      amount: entry.amount,
      type: entry.type,
      remarks: entry.remarks,
      date: entry.date
    });

    res.json({ message: 'Balance entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting balance entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 