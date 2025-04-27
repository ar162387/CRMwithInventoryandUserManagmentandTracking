/**
 * Daily job to update invoice statuses based on due dates
 * This job runs at midnight every day to check for overdue invoices
 */
const CustomerInvoice = require('../models/CustomerInvoice');
const VendorInvoice = require('../models/VendorInvoice');

/**
 * Updates the status of customer invoices based on due dates
 * @returns {Promise<Object>} Results of the update operation
 */
const updateCustomerInvoiceStatuses = async () => {
  try {
    console.log('Running customer invoice status update job...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all invoices that are:
    // 1. Not fully paid (remaining amount > 0)
    // 2. Have a due date that has passed
    // 3. Currently not marked as overdue
    const result = await CustomerInvoice.updateMany(
      {
        remainingAmount: { $gt: 0 },
        dueDate: { $lt: today },
        status: { $ne: 'overdue' }
      },
      {
        $set: { status: 'overdue' }
      }
    );

    console.log(`Customer invoice status update complete: ${result.modifiedCount} invoices marked as overdue`);
    return result;
  } catch (error) {
    console.error('Error updating customer invoice statuses:', error);
    throw error;
  }
};

/**
 * Updates the status of vendor invoices based on due dates
 * @returns {Promise<Object>} Results of the update operation
 */
const updateVendorInvoiceStatuses = async () => {
  try {
    console.log('Running vendor invoice status update job...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all invoices that are:
    // 1. Not fully paid (remaining amount > 0)
    // 2. Have a due date that has passed
    // 3. Currently not marked as overdue
    const result = await VendorInvoice.updateMany(
      {
        remainingAmount: { $gt: 0 },
        dueDate: { $lt: today },
        status: { $ne: 'overdue' }
      },
      {
        $set: { status: 'overdue' }
      }
    );

    console.log(`Vendor invoice status update complete: ${result.modifiedCount} invoices marked as overdue`);
    return result;
  } catch (error) {
    console.error('Error updating vendor invoice statuses:', error);
    throw error;
  }
};

/**
 * Run all invoice status updates
 * @returns {Promise<Object>} Combined results
 */
const runInvoiceStatusUpdates = async () => {
  try {
    const customerResults = await updateCustomerInvoiceStatuses();
    const vendorResults = await updateVendorInvoiceStatuses();

    return {
      customer: customerResults,
      vendor: vendorResults,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error running invoice status updates:', error);
    throw error;
  }
};

module.exports = {
  updateCustomerInvoiceStatuses,
  updateVendorInvoiceStatuses,
  runInvoiceStatusUpdates
}; 