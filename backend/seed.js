const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Delete existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      fullname: 'Administrator',
      password: 'admin123', // This will be hashed by the pre-save middleware
      role: 'Admin'
    });

    await adminUser.save();
    console.log('Created admin user');

    // Create a worker user
    const workerUser = new User({
      username: 'worker',
      fullname: 'Regular Worker',
      password: 'worker123', // This will be hashed by the pre-save middleware
      role: 'Worker'
    });

    await workerUser.save();
    console.log('Created worker user');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 