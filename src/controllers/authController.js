// src/controllers/authController.js
// Handles user registration and login

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
    const { name, email, password, prn, role = 'user' } = req.body;

    // Basic validation
    if (!name || !email || !password || !prn) {
      return res.status(400).json({ success: false, message: 'name, email, password and PRN are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    // Enforce @mitaoe.ac.in for students
    if (role === 'user' && !email.toLowerCase().endsWith('@mitaoe.ac.in')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only students with @mitaoe.ac.in email addresses can register.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const allowedRoles = ['admin', 'user'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or user.' });
    }

    // Check duplicate email or prn
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { prn }] });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or PRN already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      prn,
      role,
      can_scan: false // New users need admin approval
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, prn: user.prn },
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

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Enforce @mitaoe.ac.in for students on login as well
    if (user.role === 'user' && !user.email.toLowerCase().endsWith('@mitaoe.ac.in')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Student login is restricted to @mitaoe.ac.in email addresses.' 
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
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
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, created_at: user.created_at } });
  } catch (err) {
    console.error('[getMe]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = { register, login, getMe };
