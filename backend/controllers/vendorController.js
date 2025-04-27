const Vendor = require('../models/Vendor');
const { logActivity } = require('../utils/activityLogger');

// Helper function for logging vendor activities
const logVendorActivity = async (req, action, details) => {
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

// Get all vendors
exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single vendor
exports.getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new vendor
exports.createVendor = async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    const savedVendor = await vendor.save();

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Create Vendor',
        details: {
          vendorId: savedVendor._id,
          vendorName: savedVendor.vendorName
        }
      });
    }

    res.status(201).json(savedVendor);
  } catch (error) {
    console.error('Error in createVendor:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(400).json({
      message: 'Error creating vendor',
      error: error.message
    });
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Vendor',
        details: {
          vendorId: vendor._id,
          vendorName: vendor.vendorName
        }
      });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Error in updateVendor:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete vendor
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Delete Vendor',
        details: {
          vendorId: vendor._id,
          vendorName: vendor.vendorName
        }
      });
    }

    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error in deleteVendor:', error);
    res.status(500).json({ message: error.message });
  }
};

// Search vendors
exports.searchVendors = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchCondition = {
      $or: [
        { vendorName: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } }
      ]
    };

    const vendors = await Vendor.find(searchCondition).sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    console.error('Error in searchVendors:', error);
    res.status(500).json({ message: error.message });
  }
}; 