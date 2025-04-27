const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemId: {
    type: Number,
    unique: true,
    validate: {
      validator: function (v) {
        return !v || v.toString().length === 5;
      },
      message: 'Item ID must be a 5-digit number'
    }
  },
  itemName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  shopQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  shopNetWeight: {
    type: Number,
    required: true,
    default: 0
  },
  shopGrossWeight: {
    type: Number,
    required: true,
    default: 0
  },
  coldQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  coldNetWeight: {
    type: Number,
    required: true,
    default: 0
  },
  coldGrossWeight: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate unique 5-digit itemId if not provided
itemSchema.pre('save', async function (next) {
  if (!this.itemId) {
    try {
      // Start with base ID 10000
      let baseId = 10000;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 1000; // Safety limit to prevent infinite loops

      while (!isUnique && attempts < maxAttempts) {
        // Check if this ID exists
        const existingItem = await mongoose.model('Item').findOne({ itemId: baseId });

        if (!existingItem) {
          // Found a unique ID
          this.itemId = baseId;
          isUnique = true;
        } else {
          // ID exists, increment and try again
          baseId++;
          attempts++;
        }
      }

      if (!isUnique) {
        throw new Error('Could not generate a unique 5-digit ID after maximum attempts');
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item; 