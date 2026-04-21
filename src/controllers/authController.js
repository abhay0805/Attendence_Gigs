// src/controllers/authController.js
// Handles user registration and login

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/schema');
require('dotenv').config();

const SALT_ROUNDS = 12;

// ─── Register ────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { name, email, password, role? }
 * Role defaults to 'user'; only an existing admin can create another admin.
 */
async function register(req, res) {
  try {
    const { name, email, password, role = 'user' } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email and password are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const allowedRoles = ['admin', 'user'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or user.' });
    }

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const stmt = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(name.trim(), email.toLowerCase(), hashedPassword, role);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase(), role },
    });
  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: JWT access token
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Get Current User ─────────────────────────────────────────────────────────
/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
function getMe(req, res) {
  try {
    const user = db
      .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
      .get(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('[getMe]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = { register, login, getMe };
