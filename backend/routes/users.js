const express = require('express');
const User = require('../models/User');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); // Assuming middleware exists
const { logActivity } = require('../utils/activityLogger');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Middleware: Apply authentication and admin authorization to all user routes
router.use(authenticateToken);
router.use(authorizeRole(['Admin']));

// GET /api/users - Get all users (Admin only)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id - Get user by ID (Admin only)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found (invalid ID format)' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users - Create a new user (Admin only)
router.post('/', async (req, res) => {
  try {
    const { username, password, fullname, role } = req.body;

    console.log('Creating new user:', { username, fullname, role });

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user - exactly like in seed.js
    const newUser = new User({
      username,
      password, // Will be hashed by pre-save middleware
      fullname,
      role
    });

    // Save user - this will trigger the pre-save middleware
    const savedUser = await newUser.save();
    console.log('User created successfully:', savedUser.username);
    console.log('Password hash length:', savedUser.password.length);

    // Log the activity
    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: `Created new user: ${username}`,
      details: { role, fullname }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        fullname: savedUser.fullname,
        role: savedUser.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { fullname, role, username, newPassword, permissions } = req.body;

    console.log('Updating user:', {
      userId: req.params.id,
      updateData: {
        fullname,
        role,
        username,
        hasNewPassword: !!newPassword,
        hasPermissions: !!permissions,
        permissionsValue: permissions
      }
    });

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (req.user.id === req.params.id && role && role !== user.role) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    // Check if username exists (if username is being changed)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Log the changes
    const changes = [];
    if (username && username !== user.username) changes.push(`username: ${user.username} → ${username}`);
    if (fullname && fullname !== user.fullname) changes.push(`fullname: ${user.fullname} → ${fullname}`);
    if (role && role !== user.role) changes.push(`role: ${user.role} → ${role}`);
    if (newPassword) changes.push('password: updated');
    if (permissions) changes.push('permissions: updated');

    // Update user fields
    user.username = username || user.username;
    user.fullname = fullname || user.fullname;
    user.role = role || user.role;
    if (newPassword) {
      user.password = newPassword; // Will be hashed by pre-save middleware
    }
    if (permissions) {
      user.permissions = permissions;
    }

    await user.save();

    console.log('User updated successfully:', {
      userId: user._id,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      changes
    });

    // Log the activity if there were changes
    if (changes.length > 0) {
      await logActivity({
        userId: req.user.id,
        username: req.user.username,
        action: `Updated user: ${user.username}`,
        details: { changes }
      });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    await user.deleteOne();

    // Log the activity
    await logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: `Deleted user: ${user.username}`,
      details: { role: user.role, fullname: user.fullname }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 