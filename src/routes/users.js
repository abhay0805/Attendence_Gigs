// src/routes/users.js
// Admin-only user management endpoints

const express = require('express');
const router = express.Router();
const db = require('../database/schema');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

// GET /api/users – list all users (passwords excluded)
router.get('/', (req, res) => {
  try {
    const users = db
      .prepare('SELECT id, name, email, role, can_scan, created_at FROM users ORDER BY name ASC')
      .all();
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('[listUsers]', err);
    console.error('[listUsers]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// GET /api/users/:id – get a single user
router.get('/:id', (req, res) => {
  try {
    const user = db
      .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
      .get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[getUser]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// DELETE /api/users/:id – remove a user (and cascaded attendance records)
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('[deleteUser]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// PATCH /api/users/:id/permission – update scan permission
router.patch('/:id/permission', (req, res) => {
  try {
    const { can_scan } = req.body;
    if (typeof can_scan !== 'boolean') {
      return res.status(400).json({ success: false, message: 'can_scan must be boolean' });
    }
    
    const result = db.prepare('UPDATE users SET can_scan = ? WHERE id = ?')
      .run(can_scan ? 1 : 0, req.params.id);
      
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    return res.status(200).json({ success: true, message: 'User permissions updated.' });
  } catch (err) {
    console.error('[updatePermission]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
