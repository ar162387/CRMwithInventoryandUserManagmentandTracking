const Customer = require('../models/Customer');
const { logActivity } = require('../utils/activityLogger');

// Helper function for logging customer activities
const logCustomerActivity = async (req, action, details) => {
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

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single customer
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can create customers' });
    }

    const customer = new Customer(req.body);
    const savedCustomer = await customer.save();

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Create Customer',
        details: {
          customerId: savedCustomer._id,
          customerName: savedCustomer.customerName
        }
      });
    }

    res.status(201).json(savedCustomer);
  } catch (error) {
    console.error('Error in createCustomer:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(400).json({
      message: 'Error creating customer',
      error: error.message
    });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can update customers' });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Customer',
        details: {
          customerId: customer._id,
          customerName: customer.customerName
        }
      });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can delete customers' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (req.user) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Delete Customer',
        details: {
          customerId: customer._id,
          customerName: customer.customerName
        }
      });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    res.status(500).json({ message: error.message });
  }
};

// Search customers
exports.searchCustomers = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const customers = await Customer.find({
      $or: [
        { customerName: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.json(customers);
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    res.status(500).json({ message: error.message });
  }
}; 