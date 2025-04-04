const User = require('../models/User');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Make user an admin
// @route   PUT /api/users/:id/make-admin
// @access  Private/Admin
exports.makeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    user.role = 'admin';
    await user.save();

    res.json({ message: 'User successfully promoted to admin', user });
  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}; 