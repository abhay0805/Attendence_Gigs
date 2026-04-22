// src/routes/users.js
// Admin-only user management endpoints

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

// GET /api/users – list all users (passwords excluded)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ name: 1 });
    
    // Map to keep response format similar
    const mappedUsers = users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      can_scan: u.can_scan,
      created_at: u.created_at
    }));

    return res.status(200).json({ success: true, count: mappedUsers.length, users: mappedUsers });
  } catch (err) {
    console.error('[listUsers]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// GET /api/users/:id – get a single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    
    return res.status(200).json({ success: true, user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }});
  } catch (err) {
    console.error('[getUser]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// DELETE /api/users/:id – remove a user (and cascaded attendance records)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    // Manual cascade delete for attendance
    const Attendance = require('../models/Attendance');
    await Attendance.deleteMany({ user: req.params.id });

    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('[deleteUser]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// PATCH /api/users/:id/permission – update scan permission
router.patch('/:id/permission', async (req, res) => {
  try {
    let { can_scan } = req.body;
    
    // Normalize to boolean
    if (typeof can_scan === 'number') {
      can_scan = can_scan === 1;
    }
    
    if (typeof can_scan !== 'boolean') {
      return res.status(400).json({ success: false, message: 'can_scan must be boolean or 0/1' });
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, { can_scan }, { new: true });
      
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    return res.status(200).json({ success: true, message: 'User permissions updated.' });
  } catch (err) {
    console.error('[updatePermission]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
