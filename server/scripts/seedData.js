const mongoose = require('mongoose');
const User = require('../models/User');
const Loan = require('../models/Loan');
const EMI = require('../models/EMI');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/loan-management')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// Create sample users
const createUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      verificationStatus: 'verified'
    });
    
    // Create regular users
    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      phone: '9876543210',
      address: '123 Main St, Mumbai, India',
      annualIncome: 500000,
      employmentType: 'Salaried',
      employmentYears: '5',
      isVerified: true,
      verificationStatus: 'verified'
    });
    
    const user2 = await User.create({
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: hashedPassword,
      phone: '8765432109',
      address: '456 Park Ave, Delhi, India',
      annualIncome: 700000,
      employmentType: 'Self-Employed',
      employmentYears: '3',
      isVerified: false,
      verificationStatus: 'pending',
      documents: {
        aadharCard: {
          filename: 'aadhar_sample.jpg',
          path: '/uploads/documents/aadhar_sample.jpg',
          uploadDate: new Date()
        },
        panCard: {
          filename: 'pan_sample.jpg',
          path: '/uploads/documents/pan_sample.jpg',
          uploadDate: new Date()
        },
        incomeProof: {
          filename: 'income_sample.pdf',
          path: '/uploads/documents/income_sample.pdf',
          uploadDate: new Date()
        }
      }
    });
    
    const user3 = await User.create({
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password: hashedPassword,
      phone: '7654321098',
      address: '789 Lake View, Bangalore, India',
      annualIncome: 900000,
      employmentType: 'Business Owner',
      employmentYears: '7',
      isVerified: false,
      verificationStatus: 'pending',
      documents: {
        aadharCard: {
          filename: 'aadhar_sample2.jpg',
          path: '/uploads/documents/aadhar_sample2.jpg',
          uploadDate: new Date()
        },
        panCard: {
          filename: 'pan_sample2.jpg',
          path: '/uploads/documents/pan_sample2.jpg',
          uploadDate: new Date()
        }
      }
    });
    
    console.log('Sample users created successfully');
    return { admin, user1, user2, user3 };
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
};

// Create sample loans
const createLoans = async (users) => {
  try {
    // Clear existing loans
    await Loan.deleteMany({});
    
    // Create loans for each user
    const loan1 = await Loan.create({
      user: users.user1._id,
      amount: 50000,
      term: 12,
      purpose: 'Home Renovation',
      interestRate: 96,
      status: 'approved',
      applicationDate: new Date(),
      approvalDate: new Date(),
      startDate: new Date()
    });
    
    const loan2 = await Loan.create({
      user: users.user1._id,
      amount: 20000,
      term: 6,
      purpose: 'Medical Expenses',
      interestRate: 96,
      status: 'pending',
      applicationDate: new Date()
    });
    
    const loan3 = await Loan.create({
      user: users.user2._id,
      amount: 100000,
      term: 24,
      purpose: 'Education',
      interestRate: 96,
      status: 'pending',
      applicationDate: new Date()
    });
    
    console.log('Sample loans created successfully');
    return { loan1, loan2, loan3 };
  } catch (error) {
    console.error('Error creating loans:', error);
    process.exit(1);
  }
};

// Create sample EMIs
const createEMIs = async (loans) => {
  try {
    // Clear existing EMIs
    await EMI.deleteMany({});
    
    // Calculate EMI amount for loan1
    const principal = loans.loan1.amount;
    const rate = loans.loan1.interestRate / 12 / 100; // Monthly interest rate
    const time = loans.loan1.term; // Months
    const emiAmount = Math.round(principal * rate * Math.pow(1 + rate, time) / (Math.pow(1 + rate, time) - 1));
    
    // Create EMIs for loan1
    const emis = [];
    const startDate = new Date();
    
    for (let i = 0; i < loans.loan1.term; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const emi = await EMI.create({
        loan: loans.loan1._id,
        user: loans.loan1.user,
        amount: emiAmount,
        dueDate: dueDate,
        status: i === 0 ? 'paid' : 'pending'
      });
      
      emis.push(emi);
    }
    
    console.log('Sample EMIs created successfully');
    return emis;
  } catch (error) {
    console.error('Error creating EMIs:', error);
    process.exit(1);
  }
};

// Run the seed function
const seedData = async () => {
  try {
    const users = await createUsers();
    const loans = await createLoans(users);
    const emis = await createEMIs(loans);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Execute the seed function
seedData(); 