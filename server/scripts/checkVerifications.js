const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/loan-management')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Function to check pending verifications
const checkPendingVerifications = async () => {
  try {
    console.log('Checking for users with pending verifications...');
    
    // Get all users with pending/rejected verification status
    const pendingUsers = await User.find({
      verificationStatus: { $in: ['pending', 'rejected'] }
    });
    
    console.log(`Found ${pendingUsers.length} users with pending/rejected verifications`);
    
    // Display user details
    pendingUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.verificationStatus}`);
      console.log('  Documents:');
      
      if (user.documents && user.documents.aadharCard) {
        console.log(`  * Aadhar Card: ${user.documents.aadharCard.filename}`);
      }
      
      if (user.documents && user.documents.panCard) {
        console.log(`  * PAN Card: ${user.documents.panCard.filename}`);
      }
      
      if (user.documents && user.documents.incomeProof) {
        console.log(`  * Income Proof: ${user.documents.incomeProof.filename}`);
      }
      
      console.log('-------------------');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking verifications:', error);
    process.exit(1);
  }
};

// Run the check
checkPendingVerifications(); 