const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Verification fields
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  annualIncome: {
    type: Number,
    default: 0
  },
  employmentType: {
    type: String,
    enum: ['', 'Salaried', 'Self-Employed', 'Business Owner', 'Freelancer', 'Other'],
    default: ''
  },
  employmentYears: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  documents: {
    aadharCard: {
      filename: String,
      path: String,
      uploadDate: Date
    },
    panCard: {
      filename: String,
      path: String,
      uploadDate: Date
    },
    incomeProof: {
      filename: String,
      path: String,
      uploadDate: Date
    }
  },
  verificationStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'verified', 'rejected'],
    default: 'not_submitted'
  },
  verificationNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 