const CustomerInvoice = require('../models/CustomerInvoice');
const VendorInvoice = require('../models/VendorInvoice');
const Broker = require('../models/Broker');
const Commissioner = require('../models/Commissioner');
const Balance = require('../models/Balance');

// Helper to get upcoming week date range
const getUpcomingWeekRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  return { today, nextWeek };
};

/** ---------------------- Customer Invoices ----------------------- */
exports.getCustomerRemaining = async (req, res) => {
  try {
    const invoices = await CustomerInvoice.find()
      .select('invoiceNumber customerName remainingAmount status dueDate')
      .sort({ invoiceDate: -1 });

    const totalRemaining = invoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);

    res.json({ totalRemaining: Math.round(totalRemaining), invoices });
  } catch (error) {
    console.error('Error fetching customer remaining amounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCustomerPaid = async (req, res) => {
  try {
    const result = await CustomerInvoice.aggregate([
      { $group: { _id: null, totalPaid: { $sum: '$totalPaidAmount' } } },
      { $project: { _id: 0, totalPaid: { $round: ['$totalPaid', 0] } } }
    ]);
    const totalPaid = result.length > 0 ? result[0].totalPaid : 0;

    res.json({ totalPaid });
  } catch (error) {
    console.error('Error fetching customer paid amounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCustomerReminders = async (req, res) => {
  try {
    const { today, nextWeek } = getUpcomingWeekRange();

    const invoices = await CustomerInvoice.find({
      $or: [
        { status: 'overdue' },
        {
          dueDate: { $gte: today, $lte: nextWeek },
          status: { $in: ['unpaid', 'partial'] }
        }
      ]
    })
      .select('invoiceNumber customerName remainingAmount status dueDate')
      .sort({ dueDate: 1 });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching customer reminders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/** ---------------------- Vendor Invoices ----------------------- */
exports.getVendorRemaining = async (req, res) => {
  try {
    const invoices = await VendorInvoice.find()
      .select('invoiceNumber vendorName remainingAmount status dueDate')
      .sort({ invoiceDate: -1 });

    const totalRemaining = invoices.reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);

    res.json({ totalRemaining: Math.round(totalRemaining), invoices });
  } catch (error) {
    console.error('Error fetching vendor remaining amounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getVendorPaid = async (req, res) => {
  try {
    const result = await VendorInvoice.aggregate([
      { $group: { _id: null, totalPaid: { $sum: '$totalPaidAmount' } } },
      { $project: { _id: 0, totalPaid: { $round: ['$totalPaid', 0] } } }
    ]);
    const totalPaid = result.length > 0 ? result[0].totalPaid : 0;

    res.json({ totalPaid });
  } catch (error) {
    console.error('Error fetching vendor paid amounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getVendorReminders = async (req, res) => {
  try {
    const { today, nextWeek } = getUpcomingWeekRange();

    const invoices = await VendorInvoice.find({
      $or: [
        { status: 'overdue' },
        {
          dueDate: { $gte: today, $lte: nextWeek },
          status: { $in: ['unpaid', 'partial'] }
        }
      ]
    })
      .select('invoiceNumber vendorName remainingAmount status dueDate')
      .sort({ dueDate: 1 });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching vendor reminders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/** ------------------------- Brokers --------------------------- */
exports.getBrokerRemaining = async (req, res) => {
  try {
    const brokers = await Broker.find()
      .select('brokerName totalRemaining dueDate status')
      .sort({ createdAt: -1 });

    const totalRemaining = brokers.reduce((sum, b) => sum + (b.totalRemaining || 0), 0);

    res.json({ totalRemaining: Math.round(totalRemaining), brokers });
  } catch (error) {
    console.error('Error fetching broker remaining amounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBrokerPaid = async (req, res) => {
  try {
    const result = await Broker.aggregate([
      { $group: { _id: null, totalPaid: { $sum: '$totalPaid' } } },
      { $project: { _id: 0, totalPaid: { $round: ['$totalPaid', 0] } } }
    ]);

    const totalPaid = result.length > 0 ? result[0].totalPaid : 0;

    res.json({ totalPaid });
  } catch (error) {
    console.error('Error fetching broker paid amounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBrokerReminders = async (req, res) => {
  try {
    const { today, nextWeek } = getUpcomingWeekRange();

    const brokers = await Broker.find({
      $or: [
        { status: 'overdue' },
        {
          dueDate: { $gte: today, $lte: nextWeek },
          status: { $in: ['unpaid', 'partial'] }
        }
      ]
    })
      .select('brokerName totalRemaining dueDate status')
      .sort({ dueDate: 1 });

    res.json(brokers);
  } catch (error) {
    console.error('Error fetching broker reminders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/** ----------------------- Commissioners ------------------------ */
exports.getCommissionerRemaining = async (req, res) => {
  try {
    const commissioners = await Commissioner.find()
      .select('commissionerName totalRemaining dueDate status')
      .sort({ createdAt: -1 });

    const totalRemaining = commissioners.reduce((sum, c) => sum + (c.totalRemaining || 0), 0);

    res.json({ totalRemaining: Math.round(totalRemaining), commissioners });
  } catch (error) {
    console.error('Error fetching commissioner remaining amounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCommissionerPaid = async (req, res) => {
  try {
    const result = await Commissioner.aggregate([
      { $group: { _id: null, totalPaid: { $sum: '$totalPaid' } } },
      { $project: { _id: 0, totalPaid: { $round: ['$totalPaid', 0] } } }
    ]);

    const totalPaid = result.length > 0 ? result[0].totalPaid : 0;

    res.json({ totalPaid });
  } catch (error) {
    console.error('Error fetching commissioner paid amounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCommissionerReminders = async (req, res) => {
  try {
    const { today, nextWeek } = getUpcomingWeekRange();

    const commissioners = await Commissioner.find({
      $or: [
        { status: 'overdue' },
        {
          dueDate: { $gte: today, $lte: nextWeek },
          status: { $in: ['unpaid', 'partial'] }
        }
      ]
    })
      .select('commissionerName totalRemaining dueDate status')
      .sort({ dueDate: 1 });

    res.json(commissioners);
  } catch (error) {
    console.error('Error fetching commissioner reminders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/** ----------------- Circulating Supply & Balance --------------- */
exports.getCirculatingSupply = async (req, res) => {
  try {
    // Get total balance from balance collection (same as balanceController)
    const balanceResult = await Balance.aggregate([
      {
        $group: {
          _id: null,
          totalAdditions: {
            $sum: {
              $cond: [{ $eq: ['$type', 'addition'] }, '$amount', 0]
            }
          },
          totalSubtractions: {
            $sum: {
              $cond: [{ $eq: ['$type', 'subtraction'] }, '$amount', 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalBalance: { $subtract: ['$totalAdditions', '$totalSubtractions'] }
        }
      }
    ]);
    const totalBalance = balanceResult.length > 0 ? balanceResult[0].totalBalance : 0;

    // Paid sums from other entities
    const [customerPaidRes] = await CustomerInvoice.aggregate([
      { $group: { _id: null, totalPaid: { $sum: '$totalPaidAmount' } } }
    ]);
    const [vendorPaidRes] = await VendorInvoice.aggregate([
      { $group: { _id: null, totalPaid: { $sum: '$totalPaidAmount' } } }
    ]);
    const [brokerPaidRes] = await Broker.aggregate([
      { $group: { _id: null, totalPaid: { $sum: '$totalPaid' } } }
    ]);
    const [commissionerPaidRes] = await Commissioner.aggregate([
      { $group: { _id: null, totalPaid: { $sum: '$totalPaid' } } }
    ]);

    const totalPaidCustomers = customerPaidRes ? customerPaidRes.totalPaid : 0;
    const totalPaidVendors = vendorPaidRes ? vendorPaidRes.totalPaid : 0;
    const totalPaidBrokers = brokerPaidRes ? brokerPaidRes.totalPaid : 0;
    const totalPaidCommissioners = commissionerPaidRes ? commissionerPaidRes.totalPaid : 0;

    // Balance formula
    const balance = Math.round(
      totalBalance + (totalPaidCustomers + totalPaidCommissioners) - (totalPaidVendors + totalPaidBrokers)
    );

    res.json({
      totalBalance: Math.round(totalBalance),
      totalPaidCustomers: Math.round(totalPaidCustomers),
      totalPaidVendors: Math.round(totalPaidVendors),
      totalPaidBrokers: Math.round(totalPaidBrokers),
      totalPaidCommissioners: Math.round(totalPaidCommissioners),
      balance
    });
  } catch (error) {
    console.error('Error calculating circulating supply:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 