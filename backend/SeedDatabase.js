const mongoose = require('mongoose');
const Item = require('./models/Item');
const Customer = require('./models/Customer');
const Broker = require('./models/Broker');
const CustomerInvoice = require('./models/CustomerInvoice');
const VendorInvoice = require('./models/VendorInvoice');
const Vendor = require('./models/Vendor');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected successfully');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
}

// Helper functions
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDateWithinMonth() {
  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - getRandomInt(1, 90)); // Random date within past 90 days

  return pastDate;
}

function getRandomDueDate(invoiceDate) {
  const dueDate = new Date(invoiceDate);

  // 70% chance to have a due date (30% will be null - fully paid)
  if (Math.random() < 0.7) {
    dueDate.setDate(dueDate.getDate() + getRandomInt(1, 30)); // Due date within 30 days
    return dueDate;
  }

  return null;
}

// Clear existing data
async function clearDatabase() {
  console.log('Clearing existing data...');

  try {
    await Customer.deleteMany({});
    console.log('- Customer data cleared');

    await Vendor.deleteMany({});
    console.log('- Vendor data cleared');

    await Broker.deleteMany({});
    console.log('- Broker data cleared');

    await CustomerInvoice.deleteMany({});
    console.log('- CustomerInvoice data cleared');

    await VendorInvoice.deleteMany({});
    console.log('- VendorInvoice data cleared');

    await Item.deleteMany({});
    console.log('- Item data cleared');

    console.log('All existing data cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

// Generate items
async function generateItems() {
  console.log('Generating 70 items...');

  const dryFruits = [
    'Almonds', 'Walnuts', 'Cashews', 'Pistachios', 'Raisins', 'Dates', 'Apricots',
    'Figs', 'Prunes', 'Cranberries', 'Peanuts', 'Pecans', 'Hazelnuts', 'Pine Nuts',
    'Brazil Nuts', 'Chestnuts', 'Macadamias', 'Dried Mango', 'Dried Pineapple',
    'Dried Papaya', 'Dried Kiwi', 'Dried Apple', 'Dried Banana', 'Dried Strawberry',
    'Dried Blueberry', 'Dried Cherry', 'Dried Goji Berries', 'Currants', 'Mixed Berries',
    'Coconut Flakes', 'Dried Jackfruit', 'Sultanas', 'Golden Raisins', 'Dried Peaches'
  ];

  const varieties = ['Organic ', 'Premium ', 'Raw ', 'Roasted ', 'Salted ', 'Unsalted ',
    'Jumbo ', 'Sliced ', 'Diced ', 'Whole ', 'Mixed '];

  try {
    let itemsToCreate = [];
    let itemIdCounter = 10001; // Start with 5-digit itemId

    // First use base dry fruits
    for (let i = 0; i < Math.min(dryFruits.length, 35); i++) {
      itemsToCreate.push({
        itemId: itemIdCounter++,
        itemName: dryFruits[i],
        shopQuantity: 0,
        shopNetWeight: 0,
        shopGrossWeight: 0,
        coldQuantity: 0,
        coldNetWeight: 0,
        coldGrossWeight: 0
      });
    }

    // Then use varieties to create more combinations to reach 70
    const remainingItems = 70 - itemsToCreate.length;
    for (let i = 0; i < remainingItems; i++) {
      const variety = getRandomFromArray(varieties);
      const fruit = getRandomFromArray(dryFruits);

      const itemName = `${variety}${fruit}`;

      // Check if this combination already exists
      if (itemsToCreate.some(item => item.itemName === itemName)) {
        // Try again with a different combination
        i--;
        continue;
      }

      itemsToCreate.push({
        itemId: itemIdCounter++,
        itemName,
        shopQuantity: 0,
        shopNetWeight: 0,
        shopGrossWeight: 0,
        coldQuantity: 0,
        coldNetWeight: 0,
        coldGrossWeight: 0
      });
    }

    await Item.insertMany(itemsToCreate);
    console.log(`Created ${itemsToCreate.length} items`);

    return await Item.find({}).lean();
  } catch (error) {
    console.error('Error generating items:', error);
    process.exit(1);
  }
}

// Generate customers
async function generateCustomers() {
  console.log('Generating 50 customers...');

  const firstNames = ['Ali', 'Ahmed', 'Mohammad', 'Saad', 'Umar', 'Hamza', 'Bilal', 'Farhan',
    'Hasan', 'Hassan', 'Kamran', 'Salman', 'Adnan', 'Imran', 'Rizwan',
    'Sara', 'Fatima', 'Ayesha', 'Aisha', 'Maryam', 'Sadia', 'Amina', 'Nadia'];

  const lastNames = ['Khan', 'Ahmad', 'Ali', 'Malik', 'Baig', 'Sheikh', 'Qureshi', 'Syed',
    'Akhtar', 'Raza', 'Rizvi', 'Javed', 'Akram', 'Aslam', 'Butt', 'Chaudhry'];

  const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'];

  const phoneFormats = ['0300-#######', '0301-#######', '0302-#######', '0303-#######',
    '0313-#######', '0321-#######', '0333-#######', '0345-#######'];

  try {
    let customersToCreate = [];

    for (let i = 0; i < 50; i++) {
      const firstName = getRandomFromArray(firstNames);
      const lastName = getRandomFromArray(lastNames);
      const city = getRandomFromArray(cities);

      // Generate phone number
      let phoneFormat = getRandomFromArray(phoneFormats);
      let phoneNumber = '';
      for (let j = 0; j < phoneFormat.length; j++) {
        if (phoneFormat[j] === '#') {
          phoneNumber += Math.floor(Math.random() * 10);
        } else {
          phoneNumber += phoneFormat[j];
        }
      }

      customersToCreate.push({
        customerName: `${firstName} ${lastName}`,
        phoneNumber,
        city
      });
    }

    await Customer.insertMany(customersToCreate);
    console.log(`Created ${customersToCreate.length} customers`);

    return await Customer.find({}).lean();
  } catch (error) {
    console.error('Error generating customers:', error);
    process.exit(1);
  }
}

// Generate vendors
async function generateVendors() {
  console.log('Generating 50 vendors...');

  const companyNames = [
    'Fresh Harvest', 'Nature\'s Bounty', 'Organic Delights', 'Sunrise Fruits', 'Golden Farms',
    'Green Valley', 'Mountain Fresh', 'Pure Organics', 'Fruit Haven', 'Quality Produce',
    'Royal Foods', 'Premium Farms', 'Sunshine Exports', 'Valley Fresh', 'Green Earth',
    'Natural Choice', 'Organic Farms', 'Fresh Fields', 'Fruit Express', 'Premium Foods'
  ];

  const suffixes = ['Co.', 'Ltd.', 'Inc.', 'Enterprises', 'Corporation', 'Foods', 'Exports',
    'Traders', 'Suppliers', 'Distributors', 'Farms', 'Group'];

  const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'];

  const phoneFormats = ['0300-#######', '0301-#######', '0302-#######', '0303-#######',
    '0313-#######', '0321-#######', '0333-#######', '0345-#######'];

  try {
    let vendorsToCreate = [];

    for (let i = 0; i < 50; i++) {
      // Generate a unique vendor name
      let vendorName;
      do {
        const companyName = getRandomFromArray(companyNames);
        const suffix = getRandomFromArray(suffixes);
        vendorName = `${companyName} ${suffix}`;
      } while (vendorsToCreate.some(vendor => vendor.vendorName === vendorName));

      const city = getRandomFromArray(cities);

      // Generate phone number
      let phoneFormat = getRandomFromArray(phoneFormats);
      let phoneNumber = '';
      for (let j = 0; j < phoneFormat.length; j++) {
        if (phoneFormat[j] === '#') {
          phoneNumber += Math.floor(Math.random() * 10);
        } else {
          phoneNumber += phoneFormat[j];
        }
      }

      vendorsToCreate.push({
        vendorName,
        phoneNumber,
        city
      });
    }

    await Vendor.insertMany(vendorsToCreate);
    console.log(`Created ${vendorsToCreate.length} vendors`);

    return await Vendor.find({}).lean();
  } catch (error) {
    console.error('Error generating vendors:', error);
    process.exit(1);
  }
}

// Generate brokers
async function generateBrokers() {
  console.log('Generating 50 brokers...');

  const firstNames = ['Nasir', 'Arif', 'Tariq', 'Shoaib', 'Khalid', 'Javed', 'Naveed', 'Asif',
    'Asad', 'Rashid', 'Sajid', 'Majid', 'Waqar', 'Wasim', 'Nadeem', 'Naeem'];

  const lastNames = ['Khan', 'Ahmad', 'Ali', 'Malik', 'Baig', 'Sheikh', 'Qureshi', 'Syed',
    'Akhtar', 'Raza', 'Rizvi', 'Javed', 'Akram', 'Aslam', 'Butt', 'Chaudhry'];

  const cities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'];

  const phoneFormats = ['0300-#######', '0301-#######', '0302-#######', '0303-#######',
    '0313-#######', '0321-#######', '0333-#######', '0345-#######'];

  try {
    let brokersToCreate = [];

    for (let i = 0; i < 50; i++) {
      const firstName = getRandomFromArray(firstNames);
      const lastName = getRandomFromArray(lastNames);
      const city = getRandomFromArray(cities);

      // Generate phone number
      let phoneFormat = getRandomFromArray(phoneFormats);
      let phoneNumber = '';
      for (let j = 0; j < phoneFormat.length; j++) {
        if (phoneFormat[j] === '#') {
          phoneNumber += Math.floor(Math.random() * 10);
        } else {
          phoneNumber += phoneFormat[j];
        }
      }

      brokersToCreate.push({
        brokerName: `${firstName} ${lastName}`,
        phoneNumber,
        city,
        payments: [],
        totalPaid: 0,
        totalCommission: 0,
        totalRemaining: 0,
        status: 'unpaid'
      });
    }

    await Broker.insertMany(brokersToCreate);
    console.log(`Created ${brokersToCreate.length} brokers`);

    return await Broker.find({}).lean();
  } catch (error) {
    console.error('Error generating brokers:', error);
    process.exit(1);
  }
}

// Generate vendor invoices
async function generateVendorInvoices(vendors, brokers, items) {
  console.log('Generating 1000 vendor invoices and updating inventory...');

  try {
    let vendorInvoicesToCreate = [];
    const paymentMethods = ['cash', 'online', 'cheque'];

    for (let i = 0; i < 1000; i++) {
      const invoiceNumber = `V${String(10001 + i).padStart(5, '0')}`;
      const vendor = getRandomFromArray(vendors);

      // Optionally include a broker (50% chance)
      let broker = null;
      let brokerName = null;
      if (Math.random() < 0.5) {
        broker = getRandomFromArray(brokers);
        brokerName = broker.brokerName;
      }

      const invoiceDate = getRandomDateWithinMonth();
      const dueDate = getRandomDueDate(invoiceDate);

      // Generate 2-10 items for this invoice
      const itemCount = getRandomInt(2, 10);
      const invoiceItems = [];

      // Keep track of selected items to avoid too many duplicates
      const selectedItems = new Map();

      for (let j = 0; j < itemCount; j++) {
        const item = getRandomFromArray(items);

        // If this item was already selected more than once, try to pick a different one (70% chance)
        if (selectedItems.has(item._id.toString()) && selectedItems.get(item._id.toString()) >= 1 && Math.random() < 0.7) {
          j--;
          continue;
        }

        // Increment the selected item counter
        if (selectedItems.has(item._id.toString())) {
          selectedItems.set(item._id.toString(), selectedItems.get(item._id.toString()) + 1);
        } else {
          selectedItems.set(item._id.toString(), 1);
        }

        // Determine storage type (70% shop, 30% cold)
        const storageType = Math.random() < 0.7 ? 'shop' : 'cold';

        // Generate random values for the item
        const quantity = getRandomInt(20, 100);
        const netWeight = getRandomInt(200, 1000);
        const grossWeight = netWeight + getRandomInt(100, 150);
        const purchasePrice = getRandomInt(300, 600);
        const packagingCost = getRandomInt(20, 50);
        const totalPrice = Math.round(purchasePrice * netWeight) + (packagingCost * quantity);

        invoiceItems.push({
          itemId: item._id,
          itemName: item.itemName,
          quantity,
          grossWeight,
          netWeight,
          packagingCost,
          purchasePrice,
          totalPrice,
          storageType
        });

        // Update the item inventory in our database
        const updateField = storageType === 'shop' ? {
          shopQuantity: quantity,
          shopNetWeight: netWeight,
          shopGrossWeight: grossWeight
        } : {
          coldQuantity: quantity,
          coldNetWeight: netWeight,
          coldGrossWeight: grossWeight
        };

        await Item.findByIdAndUpdate(
          item._id,
          { $inc: updateField }
        );
      }

      // Generate labor and transport costs
      const labourTransportCost = getRandomInt(500, 1500);

      // Calculate subtotal and total
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const total = subtotal + labourTransportCost;

      // Determine if invoice is fully or partially paid
      const isFullyPaid = Math.random() < 0.7;

      let payments = [];
      let totalPaidAmount = 0;

      if (isFullyPaid) {
        // Full payment
        payments.push({
          amount: total,
          paymentMethod: getRandomFromArray(paymentMethods),
          paymentDate: invoiceDate
        });
        totalPaidAmount = total;
      } else {
        // Partial payment (20-80% of total)
        const partialAmount = Math.round(total * getRandomFloat(0.2, 0.8));
        payments.push({
          amount: partialAmount,
          paymentMethod: getRandomFromArray(paymentMethods),
          paymentDate: invoiceDate
        });
        totalPaidAmount = partialAmount;
      }

      const remainingAmount = total - totalPaidAmount;

      // Determine status
      let status = 'unpaid';
      if (remainingAmount <= 0) {
        status = 'paid';
      } else if (dueDate && new Date() > dueDate) {
        status = 'overdue';
      } else if (totalPaidAmount > 0) {
        status = 'partial';
      }

      vendorInvoicesToCreate.push({
        invoiceNumber,
        vendorId: vendor._id,
        vendorName: vendor.vendorName,
        brokerId: broker ? broker._id : null,
        brokerName,
        invoiceDate,
        dueDate,
        items: invoiceItems,
        labourTransportCost,
        subtotal,
        total,
        payments,
        totalPaidAmount,
        remainingAmount,
        status,
        createdAt: invoiceDate
      });

      // Log progress
      if ((i + 1) % 100 === 0) {
        console.log(`Created ${i + 1} vendor invoices...`);
      }
    }

    await VendorInvoice.insertMany(vendorInvoicesToCreate);
    console.log(`Created ${vendorInvoicesToCreate.length} vendor invoices`);

    return true;
  } catch (error) {
    console.error('Error generating vendor invoices:', error);
    process.exit(1);
  }
}

// Generate customer invoices
async function generateCustomerInvoices(customers, brokers, items) {
  console.log('Generating 1000 customer invoices and updating inventory...');

  try {
    let customerInvoicesToCreate = [];
    const paymentMethods = ['cash', 'online', 'cheque'];

    for (let i = 0; i < 1000; i++) {
      const invoiceNumber = `C${String(10001 + i).padStart(5, '0')}`;
      const customer = getRandomFromArray(customers);

      // Optionally include a broker (50% chance)
      let broker = null;
      let brokerName = null;
      let brokerCommissionPercentage = 0;
      let brokerCommissionAmount = 0;

      if (Math.random() < 0.5) {
        broker = getRandomFromArray(brokers);
        brokerName = broker.brokerName;
        brokerCommissionPercentage = getRandomFloat(5, 25, 2);
      }

      const invoiceDate = getRandomDateWithinMonth();
      const dueDate = getRandomDueDate(invoiceDate);

      // Get current item inventory for selection
      const currentItems = await Item.find({}).lean();

      // Generate 2-10 items for this invoice
      const itemCount = getRandomInt(2, 10);
      const invoiceItems = [];

      // Keep track of selected items to avoid too many duplicates
      const selectedItems = new Map();

      for (let j = 0; j < itemCount; j++) {
        // Find items with sufficient inventory
        const availableItems = currentItems.filter(item =>
          (item.shopQuantity > 10 || item.coldQuantity > 10));

        if (availableItems.length === 0) {
          continue; // Skip if no items with sufficient inventory
        }

        const item = getRandomFromArray(availableItems);

        // If this item was already selected more than once, try to pick a different one (70% chance)
        if (selectedItems.has(item._id.toString()) && selectedItems.get(item._id.toString()) >= 1 && Math.random() < 0.7) {
          j--;
          continue;
        }

        // Increment the selected item counter
        if (selectedItems.has(item._id.toString())) {
          selectedItems.set(item._id.toString(), selectedItems.get(item._id.toString()) + 1);
        } else {
          selectedItems.set(item._id.toString(), 1);
        }

        // Determine if we should take from shop or cold storage
        let quantity, netWeight, grossWeight;
        const useShopStorage = item.shopQuantity > item.coldQuantity ||
          (item.shopQuantity > 0 && Math.random() < 0.7);

        if (useShopStorage && item.shopQuantity > 0) {
          // Use shop inventory
          quantity = getRandomInt(1, Math.min(item.shopQuantity, 30));

          // Calculate proportional weights
          const proportionOfQuantity = quantity / item.shopQuantity;
          netWeight = Math.round(item.shopNetWeight * proportionOfQuantity);
          grossWeight = Math.round(item.shopGrossWeight * proportionOfQuantity);

          // Update item inventory in our database
          await Item.findByIdAndUpdate(
            item._id,
            {
              $inc: {
                shopQuantity: -quantity,
                shopNetWeight: -netWeight,
                shopGrossWeight: -grossWeight
              }
            }
          );

          // Update our local copy
          const itemIndex = currentItems.findIndex(i => i._id.toString() === item._id.toString());
          if (itemIndex >= 0) {
            currentItems[itemIndex].shopQuantity -= quantity;
            currentItems[itemIndex].shopNetWeight -= netWeight;
            currentItems[itemIndex].shopGrossWeight -= grossWeight;
          }
        } else if (item.coldQuantity > 0) {
          // Use cold inventory
          quantity = getRandomInt(1, Math.min(item.coldQuantity, 30));

          // Calculate proportional weights
          const proportionOfQuantity = quantity / item.coldQuantity;
          netWeight = Math.round(item.coldNetWeight * proportionOfQuantity);
          grossWeight = Math.round(item.coldGrossWeight * proportionOfQuantity);

          // Update item inventory in our database
          await Item.findByIdAndUpdate(
            item._id,
            {
              $inc: {
                coldQuantity: -quantity,
                coldNetWeight: -netWeight,
                coldGrossWeight: -grossWeight
              }
            }
          );

          // Update our local copy
          const itemIndex = currentItems.findIndex(i => i._id.toString() === item._id.toString());
          if (itemIndex >= 0) {
            currentItems[itemIndex].coldQuantity -= quantity;
            currentItems[itemIndex].coldNetWeight -= netWeight;
            currentItems[itemIndex].coldGrossWeight -= grossWeight;
          }
        } else {
          // Skip if no inventory
          j--;
          continue;
        }

        // Generate random values for the item
        const sellingPrice = getRandomInt(1000, 2000);
        const packagingCost = getRandomInt(30, 80);
        const totalPrice = Math.round(sellingPrice * netWeight) + (packagingCost * quantity);

        invoiceItems.push({
          itemId: item._id,
          itemName: item.itemName,
          quantity,
          grossWeight,
          netWeight,
          packagingCost,
          sellingPrice,
          totalPrice
        });
      }

      // Skip if no items could be added
      if (invoiceItems.length === 0) {
        i--;
        continue;
      }

      // Generate labor and transport costs
      const labourTransportCost = getRandomInt(500, 1500);

      // Calculate subtotal and total
      const subtotal = invoiceItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const total = subtotal + labourTransportCost;

      // Calculate broker commission if applicable
      if (broker) {
        brokerCommissionAmount = Math.round((total * brokerCommissionPercentage) / 100);

        // Update broker commission in database
        await Broker.findByIdAndUpdate(
          broker._id,
          {
            $inc: { totalCommission: brokerCommissionAmount },
            $set: { status: 'unpaid' }
          }
        );
      }

      // Determine if invoice is fully or partially paid
      const isFullyPaid = Math.random() < 0.7;

      let payments = [];
      let totalPaidAmount = 0;

      if (isFullyPaid) {
        // Full payment
        payments.push({
          amount: total,
          paymentMethod: getRandomFromArray(paymentMethods),
          paymentDate: invoiceDate
        });
        totalPaidAmount = total;
      } else {
        // Partial payment (20-80% of total)
        const partialAmount = Math.round(total * getRandomFloat(0.2, 0.8));
        payments.push({
          amount: partialAmount,
          paymentMethod: getRandomFromArray(paymentMethods),
          paymentDate: invoiceDate
        });
        totalPaidAmount = partialAmount;
      }

      const remainingAmount = total - totalPaidAmount;

      // Determine status
      let status = 'unpaid';
      if (remainingAmount <= 0) {
        status = 'paid';
      } else if (dueDate && new Date() > dueDate) {
        status = 'overdue';
      } else if (totalPaidAmount > 0) {
        status = 'partial';
      }

      customerInvoicesToCreate.push({
        invoiceNumber,
        customerId: customer._id,
        customerName: customer.customerName,
        brokerId: broker ? broker._id : null,
        brokerName,
        brokerCommissionPercentage,
        brokerCommissionAmount,
        invoiceDate,
        dueDate,
        items: invoiceItems,
        labourTransportCost,
        subtotal,
        total,
        payments,
        totalPaidAmount,
        remainingAmount,
        status,
        createdAt: invoiceDate
      });

      // Log progress
      if ((i + 1) % 100 === 0) {
        console.log(`Created ${i + 1} customer invoices...`);
      }
    }

    await CustomerInvoice.insertMany(customerInvoicesToCreate);
    console.log(`Created ${customerInvoicesToCreate.length} customer invoices`);

    return true;
  } catch (error) {
    console.error('Error generating customer invoices:', error);
    process.exit(1);
  }
}

// Main function
async function seedDatabase() {
  try {
    await connectToDatabase();
    await clearDatabase();

    const items = await generateItems();
    const customers = await generateCustomers();
    const vendors = await generateVendors();
    const brokers = await generateBrokers();

    await generateVendorInvoices(vendors, brokers, items);
    await generateCustomerInvoices(customers, brokers, items);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding process
seedDatabase(); 