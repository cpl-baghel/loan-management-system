const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// @desc    Get document file
// @route   GET /api/documents/:filename
// @access  Private/Admin
router.get('/:filename', authenticate, authorizeAdmin, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/documents', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Get document file error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router; 