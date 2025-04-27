const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; 