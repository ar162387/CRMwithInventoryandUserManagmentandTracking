const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt for username:', username);

  if (!username || !password) {
    console.log('Missing username or password');
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Find user by username
    const user = await User.findOne({ username });
    console.log('Found user:', user ? 'yes' : 'no');

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    console.log('Comparing passwords...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT Payload
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }, // Token expires in 24 hours (adjust as needed)
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          throw err;
        }
        // Log login activity
        logActivity({
          userId: user.id,
          username: user.username,
          action: 'User logged in'
        });
        console.log('Login successful for user:', username);
        res.json({
          token,
          user: { // Send back some user info (excluding password)
            id: user.id,
            username: user.username,
            fullname: user.fullname,
            role: user.role,
            permissions: user.permissions || {} // Include permissions in the response
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).send('Server error during login');
  }
});

// Update password
router.put('/update-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword; // The pre-save middleware will hash this
    await user.save();

    // Log the password change activity
    await logActivity({
      userId: user.id,
      username: user.username,
      action: 'Password updated'
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    console.log('User data from /me route:', {
      id: user._id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    });

    // Ensure permissions are included in the response
    const userData = {
      id: user._id,
      username: user.username,
      fullname: user.fullname,
      role: user.role,
      permissions: user.permissions || {}
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 