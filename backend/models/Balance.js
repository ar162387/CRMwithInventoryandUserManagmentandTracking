const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  remarks: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['addition', 'subtraction'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const Balance = mongoose.model('Balance', balanceSchema);

module.exports = Balance; 