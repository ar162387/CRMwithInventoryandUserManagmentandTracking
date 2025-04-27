const Item = require('../models/Item');
// Import the activityLogger directly like auth.js does
const { logActivity } = require('../utils/activityLogger');

// Replace the logItemActivity function to use the correct format
const logItemActivity = async (req, action, details) => {
  try {
    // Check if user information exists in request
    if (!req.user || !req.user._id) {
      console.warn('User information not available for activity logging');
      return;
    }

    // Call logActivity with the object parameter format
    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      action,
      details
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error, just log it - we don't want to break the main operation
  }
};

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single item
exports.getItem = async (req, res) => {
  try {
    const item = await Item.findOne({ itemId: req.params.itemId });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new item
exports.createItem = async (req, res) => {
  try {
    // First check if item with same name exists
    const existingItem = await Item.findOne({ itemName: req.body.itemName });
    if (existingItem) {
      return res.status(400).json({
        message: 'An item with this name already exists',
        details: {
          existingItemId: existingItem.itemId,
          existingItemName: existingItem.itemName
        }
      });
    }

    const item = new Item(req.body);
    const savedItem = await item.save();

    // Check if req.user exists to avoid errors
    if (!req.user) {
      console.error("WARNING: User information not available for activity logging in createItem");
      console.error("Headers:", req.headers);
    } else {
      // Log activity EXACTLY like in auth.js
      console.log('Create Item - User info in request:', req.user);

      try {
        await logActivity({
          userId: req.user.id,
          username: req.user.username,
          action: 'Create Item',
          details: {
            itemId: savedItem.itemId,
            itemName: savedItem.itemName
          }
        });
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }
    }

    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error in createItem:', error);
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors: messages
      });
    }

    // Handle other errors
    res.status(400).json({
      message: 'Error creating item',
      error: error.message
    });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  try {
    const oldItem = await Item.findOne({ itemId: req.params.itemId });
    if (!oldItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const item = await Item.findOneAndUpdate(
      { itemId: req.params.itemId },
      req.body,
      { new: true, runValidators: true }
    );

    // Check if req.user exists to avoid errors
    if (!req.user) {
      console.error("WARNING: User information not available for activity logging in updateItem");
      console.error("Headers:", req.headers);
    } else {
      // Log activity EXACTLY like in auth.js
      console.log('Update Item - User info in request:', req.user);

      try {
        await logActivity({
          userId: req.user.id,
          username: req.user.username,
          action: 'Update Item',
          details: {
            itemId: item.itemId,
            itemName: item.itemName
          }
        });
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }
    }

    res.json(item);
  } catch (error) {
    console.error('Error in updateItem:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findOne({ itemId: req.params.itemId });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if req.user exists to avoid errors
    if (!req.user) {
      console.error("WARNING: User information not available for activity logging in deleteItem");
      console.error("Headers:", req.headers);
    } else {
      // Log activity EXACTLY like in auth.js
      console.log('Delete Item - User info in request:', req.user);

      try {
        await logActivity({
          userId: req.user.id,
          username: req.user.username,
          action: 'Delete Item',
          details: {
            itemId: item.itemId,
            itemName: item.itemName
          }
        });
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }
    }

    await Item.findOneAndDelete({ itemId: req.params.itemId });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error in deleteItem:', error);
    res.status(500).json({ message: error.message });
  }
};

// Search items
exports.searchItems = async (req, res) => {
  try {
    const { query } = req.query;

    // Create a search condition that works for both string and number fields
    const searchCondition = {
      $or: [
        { itemName: { $regex: query, $options: 'i' } }
      ]
    };

    // Only add itemId to search if query is a number
    if (!isNaN(query)) {
      searchCondition.$or.push({ itemId: parseInt(query) });
    }

    const items = await Item.find(searchCondition).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Transfer to cold storage
exports.transferToCold = async (req, res) => {
  try {
    const { quantity, netWeight, grossWeight } = req.body;
    const item = await Item.findOne({ itemId: req.params.itemId });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Validate transfer amounts
    if (quantity > item.shopQuantity) {
      return res.status(400).json({ message: 'Transfer quantity exceeds available shop quantity' });
    }
    if (netWeight > item.shopNetWeight) {
      return res.status(400).json({ message: 'Transfer net weight exceeds available shop net weight' });
    }
    if (grossWeight > item.shopGrossWeight) {
      return res.status(400).json({ message: 'Transfer gross weight exceeds available shop gross weight' });
    }

    // Store old values for logging
    const oldValues = {
      shopQuantity: item.shopQuantity,
      shopNetWeight: item.shopNetWeight,
      shopGrossWeight: item.shopGrossWeight,
      coldQuantity: item.coldQuantity,
      coldNetWeight: item.coldNetWeight,
      coldGrossWeight: item.coldGrossWeight
    };

    // Update quantities
    item.shopQuantity -= quantity;
    item.shopNetWeight -= netWeight;
    item.shopGrossWeight -= grossWeight;
    item.coldQuantity += quantity;
    item.coldNetWeight += netWeight;
    item.coldGrossWeight += grossWeight;

    await item.save();

    // Check if req.user exists to avoid errors
    if (!req.user) {
      console.error("WARNING: User information not available for activity logging in transferToCold");
      console.error("Headers:", req.headers);
    } else {
      // Log activity EXACTLY like in auth.js
      console.log('Transfer to Cold - User info in request:', req.user);

      try {
        await logActivity({
          userId: req.user.id,
          username: req.user.username,
          action: 'Transfer to Cold Storage',
          details: {
            itemId: item.itemId,
            itemName: item.itemName,
            quantity, netWeight, grossWeight
          }
        });
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }
    }

    res.json(item);
  } catch (error) {
    console.error('Error in transferToCold:', error);
    res.status(400).json({ message: error.message });
  }
};

// Transfer to shop
exports.transferToShop = async (req, res) => {
  try {
    const { quantity, netWeight, grossWeight } = req.body;
    const item = await Item.findOne({ itemId: req.params.itemId });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Validate transfer amounts
    if (quantity > item.coldQuantity) {
      return res.status(400).json({ message: 'Transfer quantity exceeds available cold quantity' });
    }
    if (netWeight > item.coldNetWeight) {
      return res.status(400).json({ message: 'Transfer net weight exceeds available cold net weight' });
    }
    if (grossWeight > item.coldGrossWeight) {
      return res.status(400).json({ message: 'Transfer gross weight exceeds available cold gross weight' });
    }

    // Store old values for logging
    const oldValues = {
      shopQuantity: item.shopQuantity,
      shopNetWeight: item.shopNetWeight,
      shopGrossWeight: item.shopGrossWeight,
      coldQuantity: item.coldQuantity,
      coldNetWeight: item.coldNetWeight,
      coldGrossWeight: item.coldGrossWeight
    };

    // Update quantities
    item.coldQuantity -= quantity;
    item.coldNetWeight -= netWeight;
    item.coldGrossWeight -= grossWeight;
    item.shopQuantity += quantity;
    item.shopNetWeight += netWeight;
    item.shopGrossWeight += grossWeight;

    await item.save();

    // Check if req.user exists to avoid errors
    if (!req.user) {
      console.error("WARNING: User information not available for activity logging in transferToShop");
      console.error("Headers:", req.headers);
    } else {
      // Log activity EXACTLY like in auth.js
      console.log('Transfer to Shop - User info in request:', req.user);

      try {
        await logActivity({
          userId: req.user.id,
          username: req.user.username,
          action: 'Transfer to Shop',
          details: {
            itemId: item.itemId,
            itemName: item.itemName,
            quantity, netWeight, grossWeight
          }
        });
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }
    }

    res.json(item);
  } catch (error) {
    console.error('Error in transferToShop:', error);
    res.status(400).json({ message: error.message });
  }
}; 