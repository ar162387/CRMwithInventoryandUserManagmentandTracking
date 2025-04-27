const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendorName: {
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

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor; 