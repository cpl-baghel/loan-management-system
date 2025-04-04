const express = require('express');
const router = express.Router();
const {
  generateEmis,
  getAllEmis,
  getUserEmis,
  getLoanEmis,
  payEmi,
  updateOverdueEmis,
  manualUpdateEmi
} = require('../controllers/emiController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Generate EMIs for a loan (admin only)
router.post('/generate/:loanId', authenticate, authorizeAdmin, generateEmis);

// Get all EMIs (admin only)
router.get('/', authenticate, authorizeAdmin, getAllEmis);

// Get user's EMIs
router.get('/me', authenticate, getUserEmis);

// Get loan EMIs
router.get('/loan/:loanId', authenticate, getLoanEmis);

// Pay EMI
router.put('/:id/pay', authenticate, payEmi);

// Update overdue EMIs (admin only)
router.get('/update-overdue', authenticate, authorizeAdmin, updateOverdueEmis);

// Manually update EMI payment status (admin only)
router.put('/:id/manual-update', authenticate, authorizeAdmin, manualUpdateEmi);

module.exports = router; 