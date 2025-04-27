# Database Seeding Tool

This tool allows you to generate realistic fake data for your application's database. It creates:

- 70 dry fruit items (with various qualities and types)
- 50 customers
- 50 vendors
- 50 brokers
- 1000 vendor invoices (to stock inventory)
- 1000 customer invoices (that consume inventory)

## Prerequisites

- Node.js installed
- MongoDB running
- Backend server properly configured with `.env` file containing MongoDB connection string

## How to Use

1. Make sure MongoDB is running
2. Make sure your backend's `.env` file is configured with the correct `MONGODB_URI`
3. Navigate to the backend directory:
   ```
   cd backend
   ```

4. Run the seed script:
   ```
   node seedScript.js
   ```

5. Wait for the process to complete. This may take several minutes as it performs the following actions:
   - Clears existing data from the database
   - Creates all new models
   - Processes vendor invoices (adding inventory)
   - Processes customer invoices (decreasing inventory)
   - Updates broker commissions

## Important Notes

- This script will **DELETE ALL EXISTING DATA** from the following collections:
  - Items
  - Customers
  - Vendors
  - Brokers
  - VendorInvoices
  - CustomerInvoices

- The generated data is designed to be realistic with:
  - Varied item types and quantities
  - Balanced inventory levels
  - Realistic pricing
  - Proper date ranges
  - Appropriate relationships between models
  - Mixture of fully paid and partially paid invoices

- If you encounter any errors while running the script, check the following:
  - MongoDB connection
  - Database permissions
  - Model schema constraints

## Customization

If you want to modify the generated data:

1. Open the `SeedDatabase.js` file
2. Adjust the constants and parameters as needed:
   - Number of items, customers, vendors, brokers
   - Price ranges
   - Payment patterns
   - Date ranges
   - Item names and varieties

3. Run the script again to regenerate the data 