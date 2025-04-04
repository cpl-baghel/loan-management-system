const express = require('express');
const router = express.Router();
const { getAllUsers, makeAdmin } = require('../controllers/userController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Create multer instance
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email, phone, address, annualIncome, employmentType, employmentYears } = req.body;

    // Find and update user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (annualIncome) user.annualIncome = annualIncome;
    if (employmentType) user.employmentType = employmentType;
    if (employmentYears) user.employmentYears = employmentYears;

    // Save user
    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(req.user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Upload user documents
// @route   POST /api/users/documents
// @access  Private
router.post('/documents', authenticate, upload.fields([
  { name: 'aadharCard', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'incomeProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if files were uploaded
    if (!req.files) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Update user documents
    if (req.files.aadharCard) {
      const file = req.files.aadharCard[0];
      user.documents.aadharCard = {
        filename: file.filename,
        path: file.path,
        uploadDate: Date.now()
      };
    }

    if (req.files.panCard) {
      const file = req.files.panCard[0];
      user.documents.panCard = {
        filename: file.filename,
        path: file.path,
        uploadDate: Date.now()
      };
    }

    if (req.files.incomeProof) {
      const file = req.files.incomeProof[0];
      user.documents.incomeProof = {
        filename: file.filename,
        path: file.path,
        uploadDate: Date.now()
      };
    }

    // Update verification status to pending if all required documents are uploaded
    const hasAllDocuments = user.documents.aadharCard && user.documents.panCard && user.documents.incomeProof;
    if (hasAllDocuments) {
      user.verificationStatus = 'pending';
    }

    await user.save();
    res.json({
      message: 'Documents uploaded successfully',
      verificationStatus: user.verificationStatus
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Submit KYC documents with simplified approach (IDs only)
// @route   POST /api/users/kyc-simplified
// @access  Private
router.post('/kyc-simplified', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { aadharId, panId, incomeProofId } = req.body;
    
    // Validate input
    if (!aadharId || !panId || !incomeProofId) {
      return res.status(400).json({ message: 'All document IDs are required' });
    }
    
    // Initialize documents object if it doesn't exist
    if (!user.documents) {
      user.documents = {};
    }
    
    // Store document IDs instead of files
    user.documents.aadharCard = {
      documentId: aadharId,
      uploadDate: new Date()
    };
    
    user.documents.panCard = {
      documentId: panId,
      uploadDate: new Date()
    };
    
    user.documents.incomeProof = {
      documentId: incomeProofId,
      uploadDate: new Date()
    };
    
    // Update verification status to pending
    user.verificationStatus = 'pending';
    console.log(`User ${user.name} submitted KYC document IDs, setting verification status to pending`);
    
    await user.save();
    
    res.status(200).json({
      message: 'KYC document IDs submitted successfully. Your verification is pending admin approval.',
      verificationStatus: user.verificationStatus
    });
  } catch (error) {
    console.error('KYC simplified submission error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Make a user admin (admin only)
// @route   PUT /api/users/:id/make-admin
// @access  Private/Admin
router.put('/:id/make-admin', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'admin';
    await user.save();

    res.json({ message: `${user.name} is now an admin` });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Verify or reject a user (admin only)
// @route   PUT /api/users/:id/verify
// @access  Private/Admin
router.put('/:id/verify', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const user = await User.findById(req.params.id);
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
      message: `User ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
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
});

module.exports = router; 