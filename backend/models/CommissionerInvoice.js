const mongoose = require('mongoose');

const commissionerInvoiceItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: false
  },
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  grossWeight: {
    type: Number,
    required: true
  },
  netWeight: {
    type: Number,
    required: true
  },
  packagingCost: {
    type: Number,
    default: 0
  },
  salePrice: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const commissionerInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  commissionerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commissioner',
    required: false
  },
  commissionerName: {
    type: String,
    required: true
  },
  buyerName: {
    type: String,
    required: false
  },
  customerName: {
    type: String,
    required: false
  },
  commissionerPercentage: {
    type: Number,
    default: 0
  },
  commissionerAmount: {
    type: Number,
    default: 0
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: [{
    type: commissionerInvoiceItemSchema,
    required: true
  }],
  total: {
    type: Number,
    required: true,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    required: true,
    default: function () {
      return this.commissionerAmount - this.paidAmount;
    }
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'partial'],
    default: 'unpaid'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to calculate total, commissioner amount, remaining amount and status
commissionerInvoiceSchema.pre('save', function (next) {
  // Calculate total from items
  this.total = this.items.reduce((sum, item) => sum + Math.round(parseFloat(item.totalPrice || 0)), 0);

  // Calculate commissioner amount if percentage is provided
  if (this.commissionerPercentage > 0) {
    this.commissionerAmount = Math.round((this.total * this.commissionerPercentage) / 100);
  }

  // Ensure paidAmount is a whole number and not negative
  this.paidAmount = Math.max(0, Math.round(parseFloat(this.paidAmount || 0)));

  // Ensure paidAmount doesn't exceed commissionerAmount
  if (this.paidAmount > this.commissionerAmount) {
    this.paidAmount = this.commissionerAmount;
  }

  // Calculate remaining amount
  this.remainingAmount = Math.max(0, this.commissionerAmount - this.paidAmount);

  // Determine status
  if (this.remainingAmount <= 0 && this.commissionerAmount > 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0 && this.remainingAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'unpaid';
  }

  next();
});

const CommissionerInvoice = mongoose.model('CommissionerInvoice', commissionerInvoiceSchema);

module.exports = CommissionerInvoice; 