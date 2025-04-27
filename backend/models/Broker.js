const mongoose = require('mongoose');

const brokerSchema = new mongoose.Schema({
  brokerName: {
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
  },
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'online', 'cheque'],
      required: true,
      default: 'cash'
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  totalPaid: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  totalRemaining: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'partial', 'overdue'],
    default: 'unpaid'
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate totalPaid and totalRemaining
brokerSchema.pre('save', function (next) {
  // Calculate total paid from all payments and ensure it's a rounded whole number
  this.totalPaid = Math.round(
    this.payments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0)
  );

  // Ensure totalPaid is not negative
  this.totalPaid = Math.max(0, this.totalPaid);

  // Ensure totalCommission is defined, a valid number, and rounded
  if (typeof this.totalCommission !== 'number' || isNaN(this.totalCommission)) {
    this.totalCommission = 0;
  }
  this.totalCommission = Math.round(this.totalCommission);

  // Calculate totalRemaining as totalCommission - totalPaid
  // Ensure it's never negative by using Math.max
  this.totalRemaining = Math.max(0, this.totalCommission - this.totalPaid);

  // Update status based on totalPaid and totalRemaining
  if (this.totalRemaining === 0 && this.totalCommission > 0) {
    this.status = 'paid';
  } else if (this.totalRemaining > 0 && this.totalPaid > 0) {
    if (this.dueDate && new Date() > new Date(this.dueDate)) {
      this.status = 'overdue';
    } else {
      this.status = 'partial';
    }
  } else if (this.totalRemaining > 0) {
    if (this.dueDate && new Date() > new Date(this.dueDate)) {
      this.status = 'overdue';
    } else {
      this.status = 'unpaid';
    }
  }

  next();
});

const Broker = mongoose.model('Broker', brokerSchema);

module.exports = Broker; 