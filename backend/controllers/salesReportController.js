const Item = require('../models/Item');
const CustomerInvoice = require('../models/CustomerInvoice');
const CommissionerInvoice = require('../models/CommissionerInvoice');
const VendorInvoice = require('../models/VendorInvoice');
const mongoose = require('mongoose');

/**
 * Helper to build a date match object for aggregation pipelines.
 * Accepts optional ISO formatted strings for startDate / endDate
 */
function buildDateMatch(startDate, endDate, field = 'invoiceDate') {
  if (!startDate && !endDate) return {};
  const match = {};
  if (startDate) match.$gte = new Date(startDate);
  if (endDate) match.$lte = new Date(endDate);
  return { [field]: match };
}

/**
 * GET  /api/sales-report/inventory/total-items
 * Returns total number of items in inventory (count of Item documents)
 */
exports.getTotalItems = async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    res.json({ totalItems });
  } catch (error) {
    console.error('Error fetching total items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET  /api/sales-report/section-a
 * Query params: startDate, endDate (ISO strings)
 * Returns revenueFromItems, revenueFromCommissions, totalSales
 */
exports.getSectionA = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateMatchCustomer = buildDateMatch(startDate, endDate);
    const dateMatchCommissioner = buildDateMatch(startDate, endDate);

    // Revenue from items (subtotal)
    const customerAgg = [
      { $match: dateMatchCustomer },
      {
        $group: {
          _id: null,
          revenueFromItems: { $sum: '$subtotal' },
        },
      },
    ];

    const commissionerAgg = [
      { $match: dateMatchCommissioner },
      {
        $group: {
          _id: null,
          revenueFromCommissions: { $sum: '$commissionerAmount' },
        },
      },
    ];

    const [customerRes] = await CustomerInvoice.aggregate(customerAgg);
    const [commissionerRes] = await CommissionerInvoice.aggregate(commissionerAgg);

    const revenueFromItems = customerRes ? customerRes.revenueFromItems : 0;
    const revenueFromCommissions = commissionerRes ? commissionerRes.revenueFromCommissions : 0;
    const totalSales = Math.round(revenueFromItems + revenueFromCommissions);

    res.json({
      revenueFromItems: Math.round(revenueFromItems),
      revenueFromCommissions: Math.round(revenueFromCommissions),
      totalSales,
    });
  } catch (error) {
    console.error('Error calculating Section A:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/sales-report/top-selling-items
 * Query params: startDate, endDate, limit (default 5), type=top|least (default top)
 */
exports.getTopSellingItems = async (req, res) => {
  try {
    const { startDate, endDate, limit = 5, type = 'top' } = req.query;
    const dateMatch = buildDateMatch(startDate, endDate);

    const pipeline = [];
    if (Object.keys(dateMatch).length) {
      pipeline.push({ $match: dateMatch });
    }
    // Unwind items array
    pipeline.push(
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemName',
          revenue: { $sum: '$items.totalPrice' },
        },
      },
      { $project: { _id: 0, itemName: '$_id', revenue: { $round: ['$revenue', 0] } } },
      { $sort: { revenue: type === 'top' ? -1 : 1 } },
      { $limit: parseInt(limit, 10) }
    );

    const results = await CustomerInvoice.aggregate(pipeline);
    res.json(results);
  } catch (error) {
    console.error('Error fetching top/least selling items:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/sales-report/top-paying-customers
 * Query params: startDate, endDate, limit=5, type=top|least
 */
exports.getTopPayingCustomers = async (req, res) => {
  try {
    const { startDate, endDate, limit = 5, type = 'top' } = req.query;
    const dateMatch = buildDateMatch(startDate, endDate);

    const pipeline = [];
    if (Object.keys(dateMatch).length) pipeline.push({ $match: dateMatch });

    pipeline.push(
      {
        $group: {
          _id: '$customerName',
          revenue: { $sum: '$total' },
        },
      },
      { $project: { _id: 0, customerName: '$_id', revenue: { $round: ['$revenue', 0] } } },
      { $sort: { revenue: type === 'top' ? -1 : 1 } },
      { $limit: parseInt(limit, 10) }
    );

    const results = await CustomerInvoice.aggregate(pipeline);
    res.json(results);
  } catch (error) {
    console.error('Error fetching top/least paying customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/sales-report/item-analysis
 * Query params: startDate, endDate, page, pageSize, search, sortField, sortOrder
 */
exports.getItemAnalysis = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      page = 1,
      pageSize = 8,
      search = '',
      sortField = 'itemRevenue',
      sortOrder = 'desc',
    } = req.query;

    const dateMatchCustomer = buildDateMatch(startDate, endDate);
    const dateMatchVendor = buildDateMatch(startDate, endDate, 'invoiceDate');

    // ------------ CustomerInvoice aggregation -------------
    const customerPipeline = [];
    if (Object.keys(dateMatchCustomer).length) customerPipeline.push({ $match: dateMatchCustomer });
    customerPipeline.push(
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemName',
          soldQuantity: { $sum: '$items.quantity' },
          itemRevenue: { $sum: '$items.totalPrice' },
          soldCountInvoices: { $addToSet: '$_id' }, // unique invoices
        },
      },
      {
        $project: {
          itemName: '$_id',
          soldQuantity: 1,
          itemRevenue: { $round: ['$itemRevenue', 0] },
          soldCount: { $size: '$soldCountInvoices' },
        },
      }
    );

    const customerResults = await CustomerInvoice.aggregate(customerPipeline);

    // ------------ VendorInvoice aggregation -------------
    const vendorPipeline = [];
    if (Object.keys(dateMatchVendor).length) vendorPipeline.push({ $match: dateMatchVendor });
    vendorPipeline.push(
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemName',
          orderCountInvoices: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          itemName: '$_id',
          orderCount: { $size: '$orderCountInvoices' },
        },
      }
    );

    const vendorResults = await VendorInvoice.aggregate(vendorPipeline);

    // Merge results by itemName
    const vendorMap = new Map();
    vendorResults.forEach((v) => vendorMap.set(v.itemName, v.orderCount));

    const merged = customerResults.map((c) => ({
      itemName: c.itemName,
      soldQuantity: c.soldQuantity,
      itemRevenue: c.itemRevenue,
      soldCount: c.soldCount,
      orderCount: vendorMap.get(c.itemName) || 0,
    }));

    // Search filter
    const filtered = search
      ? merged.filter((m) => m.itemName.toLowerCase().includes(search.toLowerCase()))
      : merged;

    // Sorting
    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      if (sortField === 'itemName') {
        return a.itemName.localeCompare(b.itemName) * sortMultiplier;
      }
      return (a[sortField] - b[sortField]) * sortMultiplier;
    });

    // Pagination
    const totalRecords = filtered.length;
    const startIdx = (page - 1) * pageSize;
    const paginated = filtered.slice(startIdx, startIdx + parseInt(pageSize, 10));

    res.json({ totalRecords, data: paginated });
  } catch (error) {
    console.error('Error fetching item analysis:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 