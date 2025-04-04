const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getPendingVerifications,
  getUserDocuments,
  getDocumentFile,
  getAdminStats,
  updateUserVerification
} = require('../controllers/adminController');

// Get all pending verifications
router.get('/pending-verifications', protect, admin, getPendingVerifications);
router.get('/verifications', protect, admin, getPendingVerifications);

// Get user documents
router.get('/user-documents/:userId', protect, admin, getUserDocuments);
router.get('/verifications/:userId/documents', protect, admin, getUserDocuments);

// Get document file
router.get('/documents/:filename', protect, admin, getDocumentFile);
router.get('/verifications/:userId/documents/:filename', protect, admin, getDocumentFile);

// Update user verification status
router.put('/verify-user/:userId', protect, admin, updateUserVerification);
router.put('/verifications/:userId', protect, admin, updateUserVerification);

// Get admin dashboard stats
router.get('/stats', protect, admin, getAdminStats);

module.exports = router; 