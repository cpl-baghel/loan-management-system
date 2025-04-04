const express = require('express');
const router = express.Router();
const {
  getPendingVerifications,
  getUserDocuments,
  getDocumentFile,
  getAdminStats,
  verifyUser
} = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const User = require('../models/user');
const Loan = require('../models/loan');

// Get pending verifications
router.get('/pending-verifications', authenticate, authorizeAdmin, getPendingVerifications);

// Get user documents
router.get('/user-documents/:userId', authenticate, authorizeAdmin, getUserDocuments);

// Get admin dashboard stats
router.get('/stats', authenticate, authorizeAdmin, getAdminStats);

// Verify user
router.put('/verify-user/:userId', authenticate, authorizeAdmin, verifyUser);

// Document file routes (separate from admin routes in the actual API)
router.get('/documents/:filename', authenticate, authorizeAdmin, getDocumentFile);

// Direct verification endpoint - quick way to verify users
router.post('/quick-verify', authenticate, authorizeAdmin, async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isVerified = true;
    user.verificationStatus = "verified";
    await user.save();

    console.log(`User ${userId} directly verified by admin through quick-verify endpoint`);

    // Update any pending loans for this user
    await Loan.updateMany(
      { user: userId, status: 'pending' },
      { verificationStatus: 'verified' }
    );

    res.status(200).json({ 
      message: "User verified successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    console.error('Quick verify error:', error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router; 