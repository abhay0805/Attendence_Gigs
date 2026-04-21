// src/routes/attendance.js
const express = require('express');
const router = express.Router();
const {
  scan,
  getMyAttendance,
  getAllAttendance,
  getTodayAttendance,
} = require('../controllers/attendanceController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All attendance routes require authentication
router.use(authenticateToken);

// ── User routes ──────────────────────────────────────────────────────────────
router.post('/scan', scan);                    // Scan QR → check-in or check-out
router.get('/my', getMyAttendance);            // My own records (with optional date range)

// ── Admin-only routes ────────────────────────────────────────────────────────
router.get('/all', requireAdmin, getAllAttendance);       // All users' records
router.get('/today', requireAdmin, getTodayAttendance);  // Today's summary

module.exports = router;
