const Emi = require('../models/Emi');
const Loan = require('../models/Loan');
const User = require('../models/User');

// Fixed interest rate of 96% per annum (hidden from customers)
const FIXED_INTEREST_RATE = 96;

// Helper to calculate EMI amount
const calculateEmi = (principal, time) => {
  const monthlyRate = FIXED_INTEREST_RATE / 100 / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, time)) / (Math.pow(1 + monthlyRate, time) - 1);
};

// Helper to calculate late fee
const calculateLateFee = (emiAmount, daysLate) => {
  // 1% of EMI amount per day, capped at 20%
  const feePercentage = Math.min(daysLate * 1, 20);
  return (emiAmount * feePercentage) / 100;
};

// @desc    Generate EMIs for a newly approved loan
// @route   POST /api/emis/generate/:loanId
// @access  Private/Admin
exports.generateEmis = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findById(loanId);
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'approved') {
      return res.status(400).json({ message: 'EMIs can only be generated for approved loans' });
    }

    // Check if EMIs already exist for this loan
    const existingEmis = await Emi.find({ loan: loanId });
    if (existingEmis.length > 0) {
      return res.status(400).json({ message: 'EMIs have already been generated for this loan' });
    }

    const emiAmount = calculateEmi(loan.amount, loan.term);
    const emis = [];

    // Generate EMIs based on the loan term
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

    res.status(201).json({
      message: `${emis.length} EMIs generated successfully`,
      emis
    });
  } catch (error) {
    console.error('Generate EMIs error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all EMIs
// @route   GET /api/emis
// @access  Private/Admin
exports.getAllEmis = async (req, res) => {
  try {
    const emis = await Emi.find()
      .populate('loan', 'amount purpose term interestRate')
      .populate('user', 'name email')
      .sort({ dueDate: 1 });
    
    res.json(emis);
  } catch (error) {
    console.error('Get all EMIs error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user's EMIs
// @route   GET /api/emis/me
// @access  Private
exports.getUserEmis = async (req, res) => {
  try {
    const emis = await Emi.find({ user: req.user._id })
      .populate('loan', 'amount purpose term interestRate')
      .sort({ dueDate: 1 });
    
    res.json(emis);
  } catch (error) {
    console.error('Get user EMIs error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get loan EMIs
// @route   GET /api/emis/loan/:loanId
// @access  Private
exports.getLoanEmis = async (req, res) => {
  try {
    const { loanId } = req.params;
    
    const loan = await Loan.findById(loanId);
    
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Check if user is authorized to view these EMIs
    if (loan.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these EMIs' });
    }

    const emis = await Emi.find({ loan: loanId }).sort({ dueDate: 1 });
    
    res.json(emis);
  } catch (error) {
    console.error('Get loan EMIs error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Pay EMI
// @route   PUT /api/emis/:id/pay
// @access  Private
exports.payEmi = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;

    const emi = await Emi.findById(id);
    
    if (!emi) {
      return res.status(404).json({ message: 'EMI not found' });
    }

    // Check if user is authorized to pay this EMI
    if (emi.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to pay this EMI' });
    }

    if (emi.status === 'paid') {
      return res.status(400).json({ message: 'This EMI has already been paid' });
    }

    // Calculate late fee if applicable
    let lateFee = 0;
    const today = new Date();
    const dueDate = new Date(emi.dueDate);
    
    if (today > dueDate) {
      const daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      lateFee = calculateLateFee(emi.amount, daysLate);
    }

    emi.status = 'paid';
    emi.paidDate = Date.now();
    emi.paymentId = paymentId || `PAY-${Date.now()}`;
    emi.lateFee = lateFee;
    emi.totalPaid = emi.amount + lateFee;

    await emi.save();

    // Check if all EMIs for this loan are paid
    const allEmis = await Emi.find({ loan: emi.loan });
    const allPaid = allEmis.every(e => e.status === 'paid');
    
    if (allPaid) {
      // Update loan status to paid
      await Loan.findByIdAndUpdate(emi.loan, { status: 'paid' });
    }

    res.json({
      message: 'EMI paid successfully',
      emi
    });
  } catch (error) {
    console.error('Pay EMI error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update overdue EMIs
// @route   GET /api/emis/update-overdue
// @access  Private/Admin
exports.updateOverdueEmis = async (req, res) => {
  try {
    const today = new Date();
    
    // Find all pending EMIs with due dates in the past
    const overdueEmis = await Emi.find({
      status: 'pending',
      dueDate: { $lt: today }
    });

    // Update their status to overdue
    for (const emi of overdueEmis) {
      emi.status = 'overdue';
      await emi.save();
    }

    res.json({
      message: `${overdueEmis.length} EMIs marked as overdue`,
      overdueEmis
    });
  } catch (error) {
    console.error('Update overdue EMIs error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Manually update EMI payment status (for cash payments)
// @route   PUT /api/emis/:id/manual-update
// @access  Private/Admin
exports.manualUpdateEmi = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentDate, paymentReference, lateFee } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const emi = await Emi.findById(id);
    
    if (!emi) {
      return res.status(404).json({ message: 'EMI not found' });
    }

    // Only admin can manually update
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update EMI manually' });
    }

    // Update EMI fields
    emi.status = status;
    
    if (status === 'paid') {
      emi.paidDate = paymentDate ? new Date(paymentDate) : Date.now();
      emi.paymentId = paymentReference || `MANUAL-${Date.now()}`;
      
      // If lateFee is provided, use it, otherwise calculate
      if (lateFee !== undefined) {
        emi.lateFee = lateFee;
      } else if (emi.paidDate > new Date(emi.dueDate)) {
        const daysLate = Math.floor((emi.paidDate - new Date(emi.dueDate)) / (1000 * 60 * 60 * 24));
        emi.lateFee = calculateLateFee(emi.amount, daysLate);
      }
      
      emi.totalPaid = emi.amount + emi.lateFee;
      
      // Check if all EMIs for this loan are paid
      const allEmis = await Emi.find({ loan: emi.loan });
      const allPaid = allEmis.every(e => e._id.toString() === id.toString() ? true : e.status === 'paid');
      
      if (allPaid) {
        // Update loan status to paid
        await Loan.findByIdAndUpdate(emi.loan, { status: 'paid' });
      }
    }

    await emi.save();

    res.json({
      message: `EMI status manually updated to ${status}`,
      emi
    });
  } catch (error) {
    console.error('Manual update EMI error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}; 