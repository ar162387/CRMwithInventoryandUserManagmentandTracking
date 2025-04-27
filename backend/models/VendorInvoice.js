const mongoose = require('mongoose');

const vendorInvoiceItemSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  itemName: {
    type: String,
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
    required: true,
    default: 0
  },
  purchasePrice: {
    type: Number,
    required: true,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  storageType: {
    type: String,
    enum: ['shop', 'cold'],
    required: true
  }
});

const vendorInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: false
  },
  vendorName: {
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
  invoiceDate: {
    type: Date,
    required: true
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
    purchasePrice: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true
    },
    storageType: {
      type: String,
      enum: ['shop', 'cold'],
      default: 'shop'
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
vendorInvoiceSchema.pre('save', function (next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate total
  this.total = this.subtotal + this.labourTransportCost;

  // Calculate total paid amount from all payments
  this.totalPaidAmount = this.payments.reduce((sum, payment) => sum + payment.amount, 0);

  // Calculate remaining amount
  this.remainingAmount = this.total - this.totalPaidAmount;

  // Determine status based on the new requirements
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

const VendorInvoice = mongoose.model('VendorInvoice', vendorInvoiceSchema);

module.exports = VendorInvoice; 