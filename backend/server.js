const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const activityLogRoutes = require('./routes/activityLog');
const itemRoutes = require('./routes/itemRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const brokerRoutes = require('./routes/brokerRoutes');
const customerRoutes = require('./routes/customerRoutes');
const commissionerRoutes = require('./routes/commissionerRoutes');
const vendorInvoiceRoutes = require('./routes/vendorInvoiceRoutes');
const customerInvoiceRoutes = require('./routes/customerInvoiceRoutes');
const commissionerInvoiceRoutes = require('./routes/commissionerInvoiceRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const salesReportRoutes = require('./routes/salesReportRoutes');
const jobRoutes = require('./routes/jobRoutes');
const { initializeJobs } = require('./jobs');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';
    console.log('Attempting to connect to MongoDB...');

    await mongoose.connect(mongoURI);

    console.log('MongoDB Connected successfully');

    // Seed admin user if needed
    await seedAdminUser();
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

// Admin seeding function
const User = require('./models/User');
const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const adminUser = new User({
        username: 'admin',
        fullname: 'Administrator',
        password: 'password123',
        role: 'Admin'
      });
      await adminUser.save();
      console.log('Default admin user created.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Define Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity-log', activityLogRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/brokers', brokerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/commissioners', commissionerRoutes);
app.use('/api/vendor-invoices', vendorInvoiceRoutes);
app.use('/api/customer-invoices', customerInvoiceRoutes);
app.use('/api/commissioner-invoices', commissionerInvoiceRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales-report', salesReportRoutes);
app.use('/api/jobs', jobRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  // Initialize scheduled jobs
  initializeJobs();
  console.log('Scheduled jobs initialized');
}); 