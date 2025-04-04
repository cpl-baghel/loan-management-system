const User = require('../models/User');
const Loan = require('../models/Loan');
const fs = require('fs');
const path = require('path');

// @desc    Get all users pending verification
// @route   GET /api/admin/verifications
// @access  Private/Admin
exports.getPendingVerifications = async (req, res) => {
  try {
    console.log('Finding users with loans and pending verification...');
    
    // Find ALL users that have ANY loans (not just pending status)
    const allLoans = await Loan.find({});
    console.log(`Found ${allLoans.length} loans in the system`);
    
    // Get unique user IDs from loans - this ensures all users with loans are included
    // regardless of verification status
    const usersWithLoans = [...new Set(allLoans.map(loan => loan.user.toString()))];
    console.log(`Found ${usersWithLoans.length} unique users with loans`);
    
    // Also find all users with pending/rejected/not_submitted verification status
    // This ensures we get users who might not have loans yet but need verification
    const pendingVerificationUserIds = await User.find({
      verificationStatus: { $in: ['pending', 'rejected', 'not_submitted'] }
    }).distinct('_id');
    
    // Convert ObjectIDs to strings
    const pendingVerificationUsers = pendingVerificationUserIds.map(id => id.toString());
    
    console.log(`Found ${pendingVerificationUsers.length} users with pending verification status`);
    
    // Combine both lists to get all users we need to show
    const allUserIds = [...new Set([...usersWithLoans, ...pendingVerificationUsers])];
    console.log(`Combined total of ${allUserIds.length} users to display in verification panel`);
    
    if (allUserIds.length === 0) {
      console.log('No users found for verification panel');
      return res.json([]);
    }
    
    // Get full user data for all these users
    const users = await User.find({ 
      _id: { $in: allUserIds } 
    }).select('name email phone verificationStatus documents');
    
    console.log(`Retrieved ${users.length} users for verification panel`);

    // Get loan application counts for each user
    const usersWithLoanCount = await Promise.all(
      users.map(async (user) => {
        const loanCount = await Loan.countDocuments({ user: user._id });
        const pendingLoanCount = await Loan.countDocuments({ 
          user: user._id,
          status: 'pending'
        });
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email || "No email provided",
          phone: user.phone || "No phone provided",
          verificationStatus: user.verificationStatus || "not_submitted",
          loanCount,
          pendingLoanCount,
          hasLoans: loanCount > 0,
          hasPendingLoans: pendingLoanCount > 0
        };
      })
    );
    
    // Sort users: users with pending loans first, then by verification status
    usersWithLoanCount.sort((a, b) => {
      // First sort by pending loans (users with pending loans come first)
      if (a.hasPendingLoans && !b.hasPendingLoans) return -1;
      if (!a.hasPendingLoans && b.hasPendingLoans) return 1;
      
      // Then sort by verification status
      const statusOrder = { 
        'pending': 0, 
        'not_submitted': 1, 
        'rejected': 2, 
        'verified': 3 
      };
      
      return statusOrder[a.verificationStatus] - statusOrder[b.verificationStatus];
    });

    res.json(usersWithLoanCount);
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user documents
// @route   GET /api/admin/verifications/:userId/documents
// @access  Private/Admin
exports.getUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Fetching documents for user ID: ${userId}`);
    
    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`User ${user.name} documents:`, user.documents || 'No documents');
    
    // Check if the user has any documents
    if (!user.documents) {
      console.log(`User ${user.name} has no documents object`);
      return res.json({
        aadharCard: null,
        panCard: null,
        incomeProof: null,
        message: 'User has not uploaded any documents yet'
      });
    }

    // Return document filenames with better null handling
    const documents = {
      aadharCard: user.documents.aadharCard?.filename || null,
      panCard: user.documents.panCard?.filename || null,
      incomeProof: user.documents.incomeProof?.filename || null
    };

    console.log('Returning document info:', documents);
    res.json(documents);
  } catch (error) {
    console.error('Get user documents error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get document file
// @route   GET /api/admin/verifications/:userId/documents/:filename
// @access  Private/Admin
exports.getDocumentFile = async (req, res) => {
  try {
    const { userId, filename } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get document path
    let documentPath = '';
    if (user.documents?.aadharCard?.filename === filename) {
      documentPath = user.documents.aadharCard.path;
    } else if (user.documents?.panCard?.filename === filename) {
      documentPath = user.documents.panCard.path;
    } else if (user.documents?.incomeProof?.filename === filename) {
      documentPath = user.documents.incomeProof.path;
    }
    
    if (!documentPath) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    const filePath = path.join(__dirname, '..', documentPath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Document file not found on server' });
    }

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Get document file error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
  try {
    // Get verification counts
    const verificationCounts = {
      pending: await User.countDocuments({ verificationStatus: 'pending' }),
      verified: await User.countDocuments({ verificationStatus: 'verified' }),
      rejected: await User.countDocuments({ verificationStatus: 'rejected' }),
      notSubmitted: await User.countDocuments({ verificationStatus: 'not_submitted' })
    };

    // Get loan stats
    const loanCounts = {
      pending: await Loan.countDocuments({ status: 'pending' }),
      approved: await Loan.countDocuments({ status: 'approved' }),
      rejected: await Loan.countDocuments({ status: 'rejected' }),
      paid: await Loan.countDocuments({ status: 'paid' })
    };

    // Get total loan amounts
    const pendingLoans = await Loan.find({ status: 'pending' });
    const approvedLoans = await Loan.find({ status: 'approved' });
    const rejectedLoans = await Loan.find({ status: 'rejected' });
    const paidLoans = await Loan.find({ status: 'paid' });

    const loanAmounts = {
      pending: pendingLoans.reduce((sum, loan) => sum + loan.amount, 0),
      approved: approvedLoans.reduce((sum, loan) => sum + loan.amount, 0),
      rejected: rejectedLoans.reduce((sum, loan) => sum + loan.amount, 0),
      paid: paidLoans.reduce((sum, loan) => sum + loan.amount, 0)
    };

    res.json({
      verificationCounts,
      loanCounts,
      loanAmounts
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update user verification status
// @route   PUT /api/admin/verify-user/:userId
// @access  Private/Admin
exports.updateUserVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, notes } = req.body;
    
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.verificationStatus = status;
    user.isVerified = status === 'verified';
    
    if (notes) {
      user.verificationNotes = notes;
    }
    
    await user.save();
    
    res.json({ 
      message: `User verification status updated to ${status}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        verificationStatus: user.verificationStatus,
        isVerified: user.isVerified
      } 
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}; 