const mongoose = require('mongoose');
const User = require('../models/User');
const Loan = require('../models/Loan');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/loan-management')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Create directory for documents if it doesn't exist
const documentsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Create sample document files
const createSampleDocuments = () => {
  const aadharPath = path.join(documentsDir, 'sample_aadhar.jpg');
  const panPath = path.join(documentsDir, 'sample_pan.jpg');
  const incomePath = path.join(documentsDir, 'sample_income.pdf');
  
  // Create empty files if they don't exist
  if (!fs.existsSync(aadharPath)) {
    fs.writeFileSync(aadharPath, 'Sample Aadhar Card');
  }
  
  if (!fs.existsSync(panPath)) {
    fs.writeFileSync(panPath, 'Sample PAN Card');
  }
  
  if (!fs.existsSync(incomePath)) {
    fs.writeFileSync(incomePath, 'Sample Income Proof');
  }
  
  return {
    aadharPath: '/uploads/documents/sample_aadhar.jpg',
    panPath: '/uploads/documents/sample_pan.jpg',
    incomePath: '/uploads/documents/sample_income.pdf'
  };
};

// Create a pending verification user
const createPendingUser = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create document paths
    const documents = createSampleDocuments();
    
    // Create user with pending verification
    const user = await User.create({
      name: 'Pending User',
      email: 'pending@example.com',
      password: hashedPassword,
      phone: '9876543210',
      address: '123 Verification St, Mumbai, India',
      annualIncome: 600000,
      employmentType: 'Salaried',
      employmentYears: '4',
      isVerified: false,
      verificationStatus: 'pending',
      documents: {
        aadharCard: {
          filename: 'sample_aadhar.jpg',
          path: documents.aadharPath,
          uploadDate: new Date()
        },
        panCard: {
          filename: 'sample_pan.jpg',
          path: documents.panPath,
          uploadDate: new Date()
        },
        incomeProof: {
          filename: 'sample_income.pdf',
          path: documents.incomePath,
          uploadDate: new Date()
        }
      }
    });
    
    // Create a pending loan for this user
    const loan = await Loan.create({
      user: user._id,
      amount: 75000,
      term: 18,
      purpose: 'Business Expansion',
      interestRate: 96,
      status: 'pending',
      applicationDate: new Date()
    });
    
    console.log('Created pending verification user:', user.email);
    console.log('Created pending loan application:', loan._id);
    
    return { user, loan };
  } catch (error) {
    console.error('Error creating pending user:', error);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    // Check if there are already pending verifications
    const pendingUsers = await User.find({ verificationStatus: 'pending' });
    
    if (pendingUsers.length > 0) {
      console.log('Existing pending verification users:', pendingUsers.map(u => u.email));
    } else {
      // Create a new pending user
      await createPendingUser();
    }
    
    // Display all users for verification
    console.log('\nAll users in the system:');
    const allUsers = await User.find().select('name email verificationStatus');
    console.log(allUsers);
    
    process.exit(0);
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
};

// Run the script
main(); 