const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/loan-management')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

const createTestUser = async () => {
  try {
    // Create admin user directly without relying on pre-save hook
    const admin = new User({
      name: 'Test Admin',
      email: 'testadmin@example.com',
      password: 'password123',  // This will be hashed by the pre-save hook
      role: 'admin',
      isVerified: true,
      verificationStatus: 'verified'
    });
    
    await admin.save();
    
    console.log('Test admin created successfully');
    console.log('Email: testadmin@example.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
};

// Execute the function
createTestUser(); 