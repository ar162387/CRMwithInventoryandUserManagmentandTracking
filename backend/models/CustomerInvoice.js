const mongoose = require('mongoose');

const customerInvoiceItemSchema = new mongoose.Schema({
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
  sellingPrice: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const customerInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  customerName: {
    type: String,
    required: true
  },
  brokerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broker',
    required: false
  },
  brokerName: {
    type: String
  },
  brokerCommissionPercentage: {
    type: Number,
    default: 0
  },
  brokerCommissionAmount: {
    type: Number,
    default: 0
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: false
  },
  items: [{
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
    sellingPrice: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  labourTransportCost: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    required: true,
    default: function () {
      return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
  },
  total: {
    type: Number,
    required: true,
    default: function () {
      return this.subtotal + this.labourTransportCost;
    }
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
  totalPaidAmount: {
    type: Number,
    default: 0,
    get: function () {
      return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
    }
  },
  remainingAmount: {
    type: Number,
    required: true,
    default: function () {
      return this.total - this.totalPaidAmount;
    }
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'partial', 'overdue'],
    default: 'unpaid'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to calculate subtotal, total, and remaining amount
customerInvoiceSchema.pre('save', function (next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);

  // Calculate total
  this.total = this.subtotal + parseFloat(this.labourTransportCost || 0);

  // Calculate broker commission amount if broker is selected and percentage is provided
  if (this.brokerName && this.brokerCommissionPercentage > 0) {
    this.brokerCommissionAmount = Math.round((this.total * this.brokerCommissionPercentage) / 100);
  } else {
    this.brokerCommissionAmount = 0;
  }

  // Calculate total paid amount from all payments
  this.totalPaidAmount = this.payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

  // Calculate remaining amount
  this.remainingAmount = this.total - this.totalPaidAmount;

  // Determine status based on the requirements
  if (this.remainingAmount <= 0) {
    // Fully paid invoice
    this.status = 'paid';
  } else if (this.remainingAmount > 0 && this.dueDate && new Date().getTime() > new Date(this.dueDate).getTime()) {
    // Unpaid and past due - check this condition before partial payment
    this.status = 'overdue';
  } else if (this.totalPaidAmount > 0 && this.remainingAmount > 0) {
    // Partially paid invoice
    this.status = 'partial';
  } else {
    // Unpaid and not past due
    this.status = 'unpaid';
  }

  next();
});

const CustomerInvoice = mongoose.model('CustomerInvoice', customerInvoiceSchema);

module.exports = CustomerInvoice; 