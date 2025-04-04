const Loan = require('../models/Loan');
const User = require('../models/User');
const Emi = require('../models/Emi');
const fs = require('fs');
const path = require('path');

// Fixed interest rate of 96% per annum (hidden from customers)
const FIXED_INTEREST_RATE = 96;

// Helper to calculate EMI amount
const calculateEmi = (principal, time) => {
  const monthlyRate = FIXED_INTEREST_RATE / 100 / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, time)) / (Math.pow(1 + monthlyRate, time) - 1);
};

// @desc    Apply for a new loan
// @route   POST /api/loans
// @access  Private
exports.applyForLoan = async (req, res) => {
  try {
    // Basic loan data
    const { 
      amount, purpose, term, 
      fullName, email, phone, address, 
      annualIncome, employmentType, employmentYears 
    } = req.body;

    if (!amount || !purpose || !term) {
      return res.status(400).json({ message: 'Please provide all required loan details' });
    }

    // Get the user - this is a critical step
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Auto-verify the user
    if (user.verificationStatus !== 'verified') {
      user.verificationStatus = 'verified';
      user.isVerified = true;
      console.log(`Auto-verifying user ${user.name} for loan application`);
      
      // Update user fields from the form
      if (phone) user.phone = phone;
      if (address) user.address = address;
      if (annualIncome) user.annualIncome = annualIncome;
      if (employmentType) user.employmentType = employmentType;
      if (employmentYears) user.employmentYears = employmentYears;
      
      await user.save();
    }

    // Create basic loan
    const loan = await Loan.create({
      user: req.user._id,
      amount,
      purpose,
      term,
      interestRate: FIXED_INTEREST_RATE, // Set the fixed interest rate
      // Additional verification fields
      fullName: fullName || req.user.name,
      email: email || req.user.email,
      phone: phone || user.phone,
      address: address || user.address,
      annualIncome: annualIncome || user.annualIncome,
      employmentType: employmentType || user.employmentType,
      employmentYears: employmentYears || user.employmentYears
    });
    
    // Create response message
    let message = 'Loan application submitted successfully. Your application is being reviewed.';

    // Return the loan data with the updated user info
    res.status(201).json({
      loan, 
      message,
      verificationStatus: user.verificationStatus
    });
  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all loans (admin only)
// @route   GET /api/loans
// @access  Private/Admin
exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find({})
      .populate('user', 'name email phone verificationStatus')
      .populate('approvedBy', 'name email')
      .sort({ applicationDate: -1 });
    
    res.json(loans);
  } catch (error) {
    console.error('Get all loans error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get pending loans (admin only)
// @route   GET /api/loans/pending
// @access  Private/Admin
exports.getPendingLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ status: 'pending' })
      .populate('user', 'name email phone verificationStatus')
      .sort({ applicationDate: 1 });
    
    res.json(loans);
  } catch (error) {
    console.error('Get pending loans error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user's loans
// @route   GET /api/loans/me
// @access  Private
exports.getUserLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user._id })
      .sort({ applicationDate: -1 });
    
    res.json(loans);
  } catch (error) {
    console.error('Get user loans error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get loan by ID
// @route   GET /api/loans/:id
// @access  Private
exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('approvedBy', 'name email');

    // If loan doesn't exist
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Check if user is authorized to view this loan
    if (loan.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this loan' });
    }

    // Remove interest rate from response if not admin
    if (req.user.role !== 'admin') {
      const loanObj = loan.toObject();
      delete loanObj.interestRate;
      return res.json(loanObj);
    }

    res.json(loan);
  } catch (error) {
    console.error('Get loan by id error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Approve loan
// @route   PUT /api/loans/:id/approve
// @access  Private/Admin
exports.approveLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('user');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ message: `Loan is already ${loan.status}` });
    }

    // Auto-verify the user if not already verified
    if (loan.user.verificationStatus !== 'verified') {
      console.log('Auto-verifying user for loan approval');
      // Update the user verification status
      const user = await User.findById(loan.user._id);
      user.verificationStatus = 'verified';
      user.isVerified = true;
      await user.save();
      
      // Update the user in the loan object
      loan.user.verificationStatus = 'verified';
      loan.user.isVerified = true;
    }

    loan.status = 'approved';
    loan.approvalDate = Date.now();
    loan.approvedBy = req.user._id;
    loan.interestRate = FIXED_INTEREST_RATE; // Ensure fixed interest rate

    const updatedLoan = await loan.save();

    // Generate EMIs for this loan
    const emiAmount = calculateEmi(loan.amount, loan.term);
    const emis = [];

    for (let i = 1; i <= loan.term; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const emi = new Emi({
        loan: loan._id,
        user: loan.user,
        amount: emiAmount,
        dueDate,
        status: 'pending'
      });

      await emi.save();
      emis.push(emi);
    }

    res.json({
      loan: updatedLoan,
      emis: {
        count: emis.length,
        monthlyAmount: emiAmount
      }
    });
  } catch (error) {
    console.error('Approve loan error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Reject loan
// @route   PUT /api/loans/:id/reject
// @access  Private/Admin
exports.rejectLoan = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ message: `Loan is already ${loan.status}` });
    }

    loan.status = 'rejected';
    loan.rejectionReason = rejectionReason;
    loan.approvedBy = req.user._id;

    const updatedLoan = await loan.save();

    res.json(updatedLoan);
  } catch (error) {
    console.error('Reject loan error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Verify user documents
// @route   PUT /api/loans/verify-user/:userId
// @access  Private/Admin
exports.verifyUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, notes } = req.body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid verification status is required' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if documents exist
    if (!user.documents || !user.documents.aadharCard || !user.documents.panCard || !user.documents.incomeProof) {
      return res.status(400).json({ message: 'User has not uploaded all required documents' });
    }

    user.verificationStatus = status;
    user.verificationNotes = notes || '';
    user.isVerified = status === 'verified';

    await user.save();

    // Also update any pending loans for this user
    await Loan.updateMany(
      { user: userId, status: 'pending' },
      { verificationStatus: status, verificationNotes: notes || '' }
    );

    res.json({ 
      message: `User documents marked as ${status}`,
      user: { 
        _id: user._id,
        name: user.name,
        email: user.email,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    console.error('Verify user documents error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}; 