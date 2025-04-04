const express = require('express');
const router = express.Router();
const { 
  applyForLoan,
  getAllLoans,
  getPendingLoans,
  getUserLoans,
  getLoanById,
  approveLoan,
  rejectLoan,
  verifyUserDocuments
} = require('../controllers/loanController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Apply for loan
router.post('/', authenticate, applyForLoan);

// Get all loans (admin only)
router.get('/', authenticate, authorizeAdmin, getAllLoans);

// Get pending loans (admin only)
router.get('/pending', authenticate, authorizeAdmin, getPendingLoans);

// Get user's loans
router.get('/me', authenticate, getUserLoans);

// Get loan by ID
router.get('/:id', authenticate, getLoanById);

// Approve loan (admin only)
router.put('/:id/approve', authenticate, authorizeAdmin, approveLoan);

// Reject loan (admin only)
router.put('/:id/reject', authenticate, authorizeAdmin, rejectLoan);

// Verify user documents (admin only)
router.put('/verify-user/:userId', authenticate, authorizeAdmin, verifyUserDocuments);

module.exports = router; 