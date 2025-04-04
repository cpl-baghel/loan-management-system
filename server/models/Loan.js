const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  term: {
    type: Number,
    required: true
  },
  interestRate: {
    type: Number,
    default: 96 // Hidden from customers, fixed at 96%
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  approvalDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Additional fields for verification
  fullName: String,
  phone: String,
  email: String,
  address: String,
  annualIncome: Number,
  employmentType: String,
  employmentYears: String,
  documents: {
    aadharCard: String,
    panCard: String,
    incomeProof: String
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: {
    type: String,
    default: ''
  },
  creditScore: {
    type: Number,
    default: 0
  },
  risk: {
    type: String,
    enum: ['low', 'medium', 'high', 'extreme'],
    default: 'medium'
  }
});

module.exports = mongoose.model('Loan', LoanSchema); 