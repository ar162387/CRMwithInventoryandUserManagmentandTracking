const Item = require('../models/Item');

/**
 * Update item inventory based on vendor invoice
 * @param {Array} invoiceItems - Array of items from vendor invoice
 */
const updateItemInventoryFromVendorInvoice = async (invoiceItems) => {
  try {
    // Return early if no items or empty array
    if (!invoiceItems || !Array.isArray(invoiceItems) || invoiceItems.length === 0) {
      console.log('No valid items to update inventory');
      return;
    }

    console.log(`Processing ${invoiceItems.length} items for inventory update`);

    // Process each item individually, even if multiple instances of same item exist
    for (const invoiceItem of invoiceItems) {
      // Skip items that don't have an itemId (custom items)
      if (!invoiceItem.itemId) {
        console.log('Skipping custom item without itemId:', invoiceItem.itemName);
        continue;
      }

      try {
        // Ensure we're using a string ID
        const itemId = String(invoiceItem.itemId);
        console.log(`Looking up item with ID: ${itemId}, Name: ${invoiceItem.itemName}`);

        const item = await Item.findById(itemId);

        if (!item) {
          console.error(`Item with ID ${itemId} not found`);
          continue;
        }

        // Get values as floating point numbers
        const itemQuantity = parseFloat(invoiceItem.quantity || 0);
        const itemNetWeight = parseFloat(invoiceItem.netWeight || 0);
        const itemGrossWeight = parseFloat(invoiceItem.grossWeight || 0);

        console.log(`Updating inventory for item: ${item.itemName}, Storage: ${invoiceItem.storageType}`);
        console.log(`Current values - Shop: ${item.shopQuantity} qty, ${item.shopNetWeight} net, ${item.shopGrossWeight} gross`);
        console.log(`Current values - Cold: ${item.coldQuantity} qty, ${item.coldNetWeight} net, ${item.coldGrossWeight} gross`);
        console.log(`Adding: ${itemQuantity} qty, ${itemNetWeight} net, ${itemGrossWeight} gross`);

        // Update shop or cold storage based on the storageType
        if (invoiceItem.storageType === 'shop') {
          item.shopQuantity = parseFloat(item.shopQuantity || 0) + itemQuantity;
          item.shopNetWeight = parseFloat(item.shopNetWeight || 0) + itemNetWeight;
          item.shopGrossWeight = parseFloat(item.shopGrossWeight || 0) + itemGrossWeight;
        } else if (invoiceItem.storageType === 'cold') {
          item.coldQuantity = parseFloat(item.coldQuantity || 0) + itemQuantity;
          item.coldNetWeight = parseFloat(item.coldNetWeight || 0) + itemNetWeight;
          item.coldGrossWeight = parseFloat(item.coldGrossWeight || 0) + itemGrossWeight;
        }

        // Ensure no negative values
        item.shopQuantity = Math.max(0, item.shopQuantity);
        item.shopNetWeight = Math.max(0, item.shopNetWeight);
        item.shopGrossWeight = Math.max(0, item.shopGrossWeight);
        item.coldQuantity = Math.max(0, item.coldQuantity);
        item.coldNetWeight = Math.max(0, item.coldNetWeight);
        item.coldGrossWeight = Math.max(0, item.coldGrossWeight);

        console.log(`New values after update - Shop: ${item.shopQuantity} qty, ${item.shopNetWeight} net, ${item.shopGrossWeight} gross`);
        console.log(`New values after update - Cold: ${item.coldQuantity} qty, ${item.coldNetWeight} net, ${item.coldGrossWeight} gross`);

        // Save changes to database
        const savedItem = await item.save();
        console.log(`Successfully updated inventory for item: ${savedItem.itemName} (id: ${itemId})`);
      } catch (itemError) {
        console.error(`Error updating item ${invoiceItem.itemName}:`, itemError);
        // Continue processing other items even if one fails
      }
    }

    console.log('All items processed successfully for inventory update');
  } catch (error) {
    console.error('Error updating item inventory:', error);
    throw error;
  }
};

module.exports = {
  updateItemInventoryFromVendorInvoice,
}; 