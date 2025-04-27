const VendorInvoice = require('../models/VendorInvoice');
const Item = require('../models/Item');
const { updateItemInventoryFromVendorInvoice } = require('../services/itemInventoryService');
const { logActivity } = require('../utils/activityLogger');

// Create a new vendor invoice
exports.createVendorInvoice = async (req, res) => {
  try {
    // Clean up the request data to handle empty IDs
    const cleanedData = { ...req.body };

    // Handle vendorId - set to null if empty or invalid
    if (!cleanedData.vendorId || cleanedData.vendorId === '') {
      cleanedData.vendorId = null;
    }

    // Handle brokerId - set to null if empty or invalid
    if (!cleanedData.brokerId || cleanedData.brokerId === '') {
      cleanedData.brokerId = null;
    }

    // Handle itemId in each item - set to null if empty or invalid
    if (cleanedData.items && Array.isArray(cleanedData.items)) {
      cleanedData.items = cleanedData.items.map(item => {
        const cleanedItem = { ...item };
        if (!cleanedItem.itemId || cleanedItem.itemId === '') {
          cleanedItem.itemId = null;
        }
        return cleanedItem;
      });
    }

    // Only generate invoice number if not provided from frontend
    let finalInvoiceNumber = cleanedData.invoiceNumber;

    // Fallback for backward compatibility
    if (!finalInvoiceNumber) {
      const count = await VendorInvoice.countDocuments();
      finalInvoiceNumber = `VIN${String(count + 1).padStart(4, '0')}`;
    }

    // Initialize payments array
    cleanedData.payments = cleanedData.payments || [];

    // If paidAmount is provided in the request, add it as the first payment with cash method
    if (cleanedData.paidAmount && parseFloat(cleanedData.paidAmount) > 0) {
      cleanedData.payments.push({
        amount: parseFloat(cleanedData.paidAmount),
        paymentMethod: 'cash',
        paymentDate: new Date()
      });
    }

    // Create invoice with status
    const invoiceData = {
      ...cleanedData,
      invoiceNumber: finalInvoiceNumber,
      status: 'unpaid',
      createdAt: new Date()
    };

    const newInvoice = new VendorInvoice(invoiceData);
    await newInvoice.save();

    // Update item inventory based on the invoice items
    // Only update items that have valid itemIds
    const validItems = cleanedData.items.filter(item => item.itemId);
    if (validItems.length > 0) {
      await updateItemInventoryFromVendorInvoice(validItems);
    }

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Create Vendor Invoice',
        details: {
          invoiceNumber: finalInvoiceNumber,
          subtotal: newInvoice.subtotal,
          total: newInvoice.total
        }
      });
      console.log('Activity logged successfully for invoice creation');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error creating vendor invoice:', error);
    res.status(500).json({ message: 'Failed to create vendor invoice', error: error.message });
  }
};

// Get all vendor invoices
exports.getVendorInvoices = async (req, res) => {
  try {
    const invoices = await VendorInvoice.find().sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching vendor invoices:', error);
    res.status(500).json({ message: 'Failed to fetch vendor invoices', error: error.message });
  }
};

// Get vendor invoices by vendor ID
exports.getVendorInvoicesByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendorInvoices = await VendorInvoice.find({ vendorId })
      .sort({ createdAt: -1 });

    res.status(200).json(vendorInvoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single vendor invoice by ID
exports.getVendorInvoiceById = async (req, res) => {
  try {
    const invoice = await VendorInvoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Vendor invoice not found' });
    }
    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching vendor invoice:', error);
    res.status(500).json({ message: 'Failed to fetch vendor invoice', error: error.message });
  }
};

// Update a vendor invoice
exports.updateVendorInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };
    const originalItems = updatedData.originalItems || [];

    // Remove originalItems from the data to be saved
    delete updatedData.originalItems;

    // Get the current invoice
    const currentInvoice = await VendorInvoice.findById(id);

    if (!currentInvoice) {
      return res.status(404).json({ message: 'Vendor invoice not found' });
    }

    // Store original values for logging
    const originalSubtotal = currentInvoice.subtotal;
    const originalTotal = currentInvoice.total;

    // Debug item IDs to ensure they're properly defined
    console.log('DEBUG - Original items:');
    originalItems.forEach((item, index) => {
      console.log(`[${index}] ID: ${item.itemId}, Name: ${item.itemName}, Storage: ${item.storageType}, Qty: ${item.quantity}`);
    });

    console.log('DEBUG - Updated items:');
    updatedData.items.forEach((item, index) => {
      console.log(`[${index}] ID: ${item.itemId}, Name: ${item.itemName}, Storage: ${item.storageType}, Qty: ${item.quantity}`);
    });

    console.log('Original items:', JSON.stringify(originalItems));
    console.log('Updated items:', JSON.stringify(updatedData.items));

    // Log the received totals for debugging
    console.log('Received totals:', {
      subtotal: updatedData.subtotal,
      total: updatedData.total,
      remainingAmount: updatedData.remainingAmount
    });

    // Ensure all numeric values are properly rounded to integers
    updatedData.subtotal = Math.round(parseFloat(updatedData.subtotal || 0));
    updatedData.total = Math.round(parseFloat(updatedData.total || 0));
    updatedData.remainingAmount = Math.round(parseFloat(updatedData.remainingAmount || 0));
    updatedData.paidAmount = Math.round(parseFloat(updatedData.paidAmount || 0));
    updatedData.labourTransportCost = Math.round(parseFloat(updatedData.labourTransportCost || 0));

    // Update status based on remaining amount
    if (updatedData.remainingAmount <= 0) {
      updatedData.status = 'paid';
    } else if (updatedData.totalPaidAmount > 0 && updatedData.remainingAmount > 0) {
      updatedData.status = 'partial';
    } else if (updatedData.remainingAmount > 0 && updatedData.dueDate && new Date() > new Date(updatedData.dueDate)) {
      updatedData.status = 'overdue';
    } else {
      updatedData.status = 'unpaid';
    }

    // Calculate inventory adjustments based on changes
    await adjustInventoryForInvoiceUpdate(originalItems, updatedData.items);

    // Update the invoice with the new data
    const updatedInvoice = await VendorInvoice.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    );

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Update Vendor Invoice',
        details: {
          invoiceNumber: updatedInvoice.invoiceNumber,
          previousSubtotal: originalSubtotal,
          previousTotal: originalTotal,
          newSubtotal: updatedInvoice.subtotal,
          newTotal: updatedInvoice.total
        }
      });
      console.log('Activity logged successfully for invoice update');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error updating vendor invoice:', error);
    res.status(500).json({ message: 'Failed to update vendor invoice', error: error.message });
  }
};

/**
 * Adjust inventory when updating an invoice
 * @param {Array} originalItems - The original items from the invoice
 * @param {Array} newItems - The updated items
 */
const adjustInventoryForInvoiceUpdate = async (originalItems, newItems) => {
  try {
    console.log('Starting inventory adjustment process...');

    if (!originalItems || !Array.isArray(originalItems)) {
      console.log('No original items to process');
      return;
    }

    if (!newItems || !Array.isArray(newItems)) {
      console.log('No new items to process');
      return;
    }

    console.log(`Processing ${originalItems.length} original items and ${newItems.length} new items`);

    // Step 1: First, decrement all original items from inventory
    console.log('STEP 1: Decrementing all original items from inventory');
    for (const originalItem of originalItems) {
      if (!originalItem.itemId) {
        console.log('Skipping original item without itemId:', originalItem.itemName);
        continue;
      }

      const originalItemId = String(originalItem.itemId);
      console.log(`Removing original item: ${originalItem.itemName} (${originalItemId}) from inventory`);

      // Decrement this item from inventory (subtract with negative quantities)
      await adjustItemInventory(
        originalItemId,
        originalItem.storageType,
        -parseFloat(originalItem.quantity || 0),
        -parseFloat(originalItem.netWeight || 0),
        -parseFloat(originalItem.grossWeight || 0)
      );
    }

    // Step 2: Then, increment all new items to inventory
    console.log('STEP 2: Adding all new items to inventory');
    for (const newItem of newItems) {
      if (!newItem.itemId) {
        console.log('Skipping new item without itemId:', newItem.itemName);
        continue;
      }

      const newItemId = String(newItem.itemId);
      console.log(`Adding new item: ${newItem.itemName} (${newItemId}) to inventory`);

      // Increment this item to inventory
      await adjustItemInventory(
        newItemId,
        newItem.storageType,
        parseFloat(newItem.quantity || 0),
        parseFloat(newItem.netWeight || 0),
        parseFloat(newItem.grossWeight || 0)
      );
    }

    console.log('Inventory adjustment process completed successfully');
  } catch (error) {
    console.error('Error adjusting inventory for invoice update:', error);
    throw error;
  }
};

/**
 * Adjust item inventory with given values
 * @param {String} itemId - The item ID
 * @param {String} storageType - 'shop' or 'cold'
 * @param {Number} quantity - Quantity to adjust (can be negative)
 * @param {Number} netWeight - Net weight to adjust (can be negative)
 * @param {Number} grossWeight - Gross weight to adjust (can be negative)
 */
const adjustItemInventory = async (itemId, storageType, quantity, netWeight, grossWeight) => {
  try {
    console.log(`Adjusting inventory for item ${itemId}: ${storageType}, qty: ${quantity}, net: ${netWeight}, gross: ${grossWeight}`);

    // Force itemId to be a string
    const itemIdStr = String(itemId);
    console.log(`Looking up item with ID: ${itemIdStr}`);

    const item = await Item.findById(itemIdStr);

    if (!item) {
      console.error(`Item with ID ${itemIdStr} not found`);
      return;
    }

    // Convert values to numbers but keep precision for weights
    quantity = parseFloat(quantity);
    netWeight = parseFloat(netWeight);
    grossWeight = parseFloat(grossWeight);

    // Only round monetary values to integers, not weights or quantities
    console.log(`Processing item: ${item.itemName} (ID: ${itemIdStr})`);
    console.log(`  Before update:`);
    console.log(`  Shop values: qty=${item.shopQuantity}, net=${item.shopNetWeight}, gross=${item.shopGrossWeight}`);
    console.log(`  Cold values: qty=${item.coldQuantity}, net=${item.coldNetWeight}, gross=${item.coldGrossWeight}`);
    console.log(`  Adjustment values: qty=${quantity}, net=${netWeight}, gross=${grossWeight}`);

    // Update shop or cold storage based on the storageType
    if (storageType === 'shop') {
      item.shopQuantity = parseFloat(item.shopQuantity || 0) + quantity;
      item.shopNetWeight = parseFloat(item.shopNetWeight || 0) + netWeight;
      item.shopGrossWeight = parseFloat(item.shopGrossWeight || 0) + grossWeight;
    } else if (storageType === 'cold') {
      item.coldQuantity = parseFloat(item.coldQuantity || 0) + quantity;
      item.coldNetWeight = parseFloat(item.coldNetWeight || 0) + netWeight;
      item.coldGrossWeight = parseFloat(item.coldGrossWeight || 0) + grossWeight;
    }

    // Ensure no negative values
    item.shopQuantity = Math.max(0, item.shopQuantity);
    item.shopNetWeight = Math.max(0, item.shopNetWeight);
    item.shopGrossWeight = Math.max(0, item.shopGrossWeight);
    item.coldQuantity = Math.max(0, item.coldQuantity);
    item.coldNetWeight = Math.max(0, item.coldNetWeight);
    item.coldGrossWeight = Math.max(0, item.coldGrossWeight);

    console.log(`  After update:`);
    console.log(`  Shop values: qty=${item.shopQuantity}, net=${item.shopNetWeight}, gross=${item.shopGrossWeight}`);
    console.log(`  Cold values: qty=${item.coldQuantity}, net=${item.coldNetWeight}, gross=${item.coldGrossWeight}`);

    // Make sure to await the save operation
    const savedItem = await item.save();
    console.log(`Successfully adjusted inventory for item: ${savedItem.itemName} (ID: ${itemIdStr})`);
    console.log(`  Final saved values:`);
    console.log(`  Shop values: qty=${savedItem.shopQuantity}, net=${savedItem.shopNetWeight}, gross=${savedItem.shopGrossWeight}`);
    console.log(`  Cold values: qty=${savedItem.coldQuantity}, net=${savedItem.coldNetWeight}, gross=${savedItem.coldGrossWeight}`);

    return savedItem;
  } catch (error) {
    console.error(`Error adjusting inventory for item ${itemId}:`, error);
    throw error;
  }
};

// Delete a vendor invoice
exports.deleteVendorInvoice = async (req, res) => {
  try {
    const invoice = await VendorInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Vendor invoice not found' });
    }

    // Store invoice details for logging
    const invoiceNumber = invoice.invoiceNumber;
    const subtotal = invoice.subtotal;
    const total = invoice.total;

    // Check if deleting this invoice would cause any item quantities to go negative
    const inventoryValidationResult = await validateInventoryForDeletion(invoice);

    if (!inventoryValidationResult.success) {
      return res.status(400).json({
        message: 'Cannot delete invoice as it would cause negative inventory quantities',
        details: inventoryValidationResult.details
      });
    }

    // Reverse inventory adjustments for all items in the invoice
    await reverseInventoryAdjustments(invoice);

    // Now delete the invoice
    await VendorInvoice.findByIdAndDelete(req.params.id);

    // Log the activity
    if (req.user && req.user.id && req.user.username) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: 'Delete Vendor Invoice',
        details: {
          invoiceNumber: invoiceNumber,
          subtotal: subtotal,
          total: total
        }
      });
      console.log('Activity logged successfully for invoice deletion');
    } else {
      console.warn('Could not log activity: User information not available', req.user);
    }

    res.status(200).json({ message: 'Vendor invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor invoice:', error);
    res.status(500).json({ message: 'Failed to delete vendor invoice', error: error.message });
  }
};

/**
 * Validate if deleting an invoice would cause negative inventory quantities
 * @param {Object} invoice - The invoice to be deleted
 * @returns {Object} - Result object with success flag and details
 */
const validateInventoryForDeletion = async (invoice) => {
  try {
    const itemAdjustments = {};

    // First, collect all the adjustments needed by item ID and storage type
    for (const invoiceItem of invoice.items) {
      if (!invoiceItem.itemId) continue;

      const itemId = String(invoiceItem.itemId);
      const storageType = invoiceItem.storageType;
      const quantity = parseFloat(invoiceItem.quantity || 0);
      const netWeight = parseFloat(invoiceItem.netWeight || 0);
      const grossWeight = parseFloat(invoiceItem.grossWeight || 0);

      if (!itemAdjustments[itemId]) {
        itemAdjustments[itemId] = {
          shop: { quantity: 0, netWeight: 0, grossWeight: 0 },
          cold: { quantity: 0, netWeight: 0, grossWeight: 0 }
        };
      }

      // Add the adjustment (these values will be subtracted from inventory)
      itemAdjustments[itemId][storageType].quantity += quantity;
      itemAdjustments[itemId][storageType].netWeight += netWeight;
      itemAdjustments[itemId][storageType].grossWeight += grossWeight;
    }

    // Now check each item to ensure deletion won't cause negative quantities
    const validationErrors = [];

    for (const itemId in itemAdjustments) {
      const item = await Item.findById(itemId);

      if (!item) {
        validationErrors.push(`Item with ID ${itemId} not found in inventory`);
        continue;
      }

      const shopAdjustment = itemAdjustments[itemId].shop;
      const coldAdjustment = itemAdjustments[itemId].cold;

      // Check if shop storage would go negative
      if (item.shopQuantity < shopAdjustment.quantity) {
        validationErrors.push(`Cannot delete: Item "${item.itemName}" shop quantity would become negative (Current: ${item.shopQuantity}, Required: ${shopAdjustment.quantity})`);
      }

      if (item.shopNetWeight < shopAdjustment.netWeight) {
        validationErrors.push(`Cannot delete: Item "${item.itemName}" shop net weight would become negative (Current: ${item.shopNetWeight}, Required: ${shopAdjustment.netWeight})`);
      }

      if (item.shopGrossWeight < shopAdjustment.grossWeight) {
        validationErrors.push(`Cannot delete: Item "${item.itemName}" shop gross weight would become negative (Current: ${item.shopGrossWeight}, Required: ${shopAdjustment.grossWeight})`);
      }

      // Check if cold storage would go negative
      if (item.coldQuantity < coldAdjustment.quantity) {
        validationErrors.push(`Cannot delete: Item "${item.itemName}" cold quantity would become negative (Current: ${item.coldQuantity}, Required: ${coldAdjustment.quantity})`);
      }

      if (item.coldNetWeight < coldAdjustment.netWeight) {
        validationErrors.push(`Cannot delete: Item "${item.itemName}" cold net weight would become negative (Current: ${item.coldNetWeight}, Required: ${coldAdjustment.netWeight})`);
      }

      if (item.coldGrossWeight < coldAdjustment.grossWeight) {
        validationErrors.push(`Cannot delete: Item "${item.itemName}" cold gross weight would become negative (Current: ${item.coldGrossWeight}, Required: ${coldAdjustment.grossWeight})`);
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        details: validationErrors
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error validating inventory for deletion:', error);
    throw error;
  }
};

/**
 * Reverse inventory adjustments for all items in an invoice
 * @param {Object} invoice - The invoice being deleted
 */
const reverseInventoryAdjustments = async (invoice) => {
  try {
    // Process each item in the invoice
    for (const invoiceItem of invoice.items) {
      if (!invoiceItem.itemId) continue;

      const itemId = String(invoiceItem.itemId);
      const storageType = invoiceItem.storageType;
      const quantity = parseFloat(invoiceItem.quantity || 0);
      const netWeight = parseFloat(invoiceItem.netWeight || 0);
      const grossWeight = parseFloat(invoiceItem.grossWeight || 0);

      const item = await Item.findById(itemId);

      if (!item) {
        console.warn(`Item with ID ${itemId} not found when reversing inventory adjustments`);
        continue;
      }

      // Decrement quantities based on storage type
      if (storageType === 'shop') {
        item.shopQuantity = Math.max(0, item.shopQuantity - quantity);
        item.shopNetWeight = Math.max(0, item.shopNetWeight - netWeight);
        item.shopGrossWeight = Math.max(0, item.shopGrossWeight - grossWeight);
      } else if (storageType === 'cold') {
        item.coldQuantity = Math.max(0, item.coldQuantity - quantity);
        item.coldNetWeight = Math.max(0, item.coldNetWeight - netWeight);
        item.coldGrossWeight = Math.max(0, item.coldGrossWeight - grossWeight);
      }

      await item.save();
      console.log(`Decremented inventory for item ${item.itemName} (${itemId}) - Storage: ${storageType}, Qty: -${quantity}, Net: -${netWeight}, Gross: -${grossWeight}`);
    }
  } catch (error) {
    console.error('Error reversing inventory adjustments:', error);
    throw error;
  }
};

// Search vendor invoices
exports.searchVendorInvoices = async (req, res) => {
  try {
    const { query } = req.query;

    const vendorInvoices = await VendorInvoice.find({
      $or: [
        { invoiceNumber: { $regex: query, $options: 'i' } },
        { vendorName: { $regex: query, $options: 'i' } },
        { brokerName: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(vendorInvoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update vendor invoice payment
exports.updateVendorInvoicePayment = async (req, res) => {
  try {
    console.log('updateVendorInvoicePayment - Received request:', {
      params: req.params,
      body: req.body
    });

    // Debug user information
    console.log('Request user information:', req.user ? {
      id: req.user.id,
      username: req.user.username
    } : 'No user information available');

    const { id } = req.params;
    const { amount, paidAmount, paymentMethod, paymentDate, dueDate } = req.body;

    // Log what values we extracted
    console.log('Extracted values:', {
      id,
      amount,
      paidAmount,
      paymentMethod,
      paymentDate,
      dueDate
    });

    // Check if either amount or paidAmount is provided
    const paymentAmount = amount || paidAmount;

    if (!paymentAmount) {
      console.log('Payment validation failed: No payment amount provided');
      return res.status(400).json({ message: 'Paid amount is required' });
    }

    const invoice = await VendorInvoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ message: 'Vendor invoice not found' });
    }

    // Debug the payment about to be added
    console.log('Adding payment to invoice:', {
      invoiceId: id,
      paymentAmount: parseFloat(paymentAmount),
      paymentMethod: paymentMethod || 'cash',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date()
    });

    // Add the new payment to the payments array - use paymentAmount instead of amount
    invoice.payments.push({
      amount: parseFloat(paymentAmount),
      paymentMethod: paymentMethod || 'cash',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date()
    });

    // Update the due date if provided
    if (dueDate) {
      invoice.dueDate = new Date(dueDate);
    }

    // Save the invoice - the pre-save hook will update the totalPaidAmount, status and remaining amount
    const savedInvoice = await invoice.save();

    // Log activity
    try {
      if (req.user && req.user.id && req.user.username) {
        console.log('Attempting to log activity with user:', {
          id: req.user.id,
          username: req.user.username
        });

        await logActivity({
          userId: req.user.id,
          username: req.user.username,
          action: 'Update Vendor Invoice Payment',
          details: {
            invoiceNumber: savedInvoice.invoiceNumber,
            paymentAmount: parseFloat(paymentAmount)
          }
        });
        console.log('Activity logged successfully for payment update');
      } else {
        console.warn('Could not log activity: User information not available or incomplete', req.user);
      }
    } catch (logError) {
      console.error('Error logging activity:', logError);
      // Continue with the response despite logging error
    }

    // Debug the updated invoice state after save
    console.log('Invoice after payment update:', {
      id: savedInvoice._id,
      totalPaidAmount: savedInvoice.totalPaidAmount,
      remainingAmount: savedInvoice.remainingAmount,
      status: savedInvoice.status,
      payments: savedInvoice.payments.length
    });

    res.status(200).json(savedInvoice);
  } catch (error) {
    console.error('Error updating invoice payment:', error);
    res.status(500).json({ message: 'Failed to update invoice payment', error: error.message });
  }
}; 