// src/controllers/attendanceController.js
// Core attendance scan logic and admin reporting

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { isCurrentlyActiveIST, STATIC_QR_TOKEN } = require('../utils/time');

/**
 * Returns today's date as YYYY-MM-DD string.
 */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns the current datetime as an ISO string.
 */
function nowISO() {
  return new Date().toISOString();
}

// ─── Scan QR (check-in / check-out) ──────────────────────────────────────────
/**
 * POST /api/attendance/scan
 * Body: { token }   — the QR code value scanned by the user
 */
async function scan(req, res) {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    const date = today();

    console.log(`[ScanAttempt] User: ${userId}, Token: "${token}", Date: ${date}`);
    console.log('[RequestBody]', JSON.stringify(req.body));

    // ── 0. Validate user permission ──
    const user = await User.findById(userId);
    if (!user) {
      console.log(`[ScanError] User not found: ${userId}`);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.can_scan) {
      console.log(`[ScanError] Permission denied for user: ${userId}`);
      return res.status(403).json({
        success: false,
        message: 'You have not been granted permission to scan the attendance QR code. Please contact the administrator.',
      });
    }

    if (!token) {
      return res.status(400).json({ success: false, message: 'QR token is required.' });
    }

    // ── 3. Check existing attendance record ──
    const attendance = await Attendance.findOne({ user: userId, date });

    // ── 3c. Both check-in and check-out already recorded ──
    if (attendance && attendance.check_in_time && attendance.check_out_time) {
      return res.status(409).json({
        success: false,
        message: 'You have already completed check-in and check-out for today.',
        attendance,
      });
    }

    // ── 3b. check-in exists, record check-out ──
    if (attendance && attendance.check_in_time && !attendance.check_out_time) {
      attendance.check_out_time = nowISO();
      await attendance.save();
      console.log(`[ScanSuccess] Check-out recorded for user: ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Check-out recorded successfully.',
        action: 'check_out',
        attendance,
      });
    }

    // ── 3a. No record → record check-in ──
    const created = await Attendance.create({
      user: userId,
      date,
      check_in_time: nowISO()
    });
    console.log(`[ScanSuccess] Check-in recorded for user: ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully.',
      action: 'check_in',
      attendance: created,
    });
  } catch (err) {
    console.error('[scan]', err);
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance record already exists for today.',
      });
    }
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Get my attendance ────────────────────────────────────────────────────────
/**
 * GET /api/attendance/my?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
async function getMyAttendance(req, res) {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;

    let filter = { user: userId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const records = await Attendance.find(filter).sort({ date: -1 });
    
    const mappedRecords = records.map(r => ({
      id: r._id.toString(),
      date: r.date,
      check_in_time: r.check_in_time,
      check_out_time: r.check_out_time,
      created_at: r.created_at
    }));

    return res.status(200).json({ success: true, count: mappedRecords.length, records: mappedRecords });
  } catch (err) {
    console.error('[getMyAttendance]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Admin: Get all attendance ────────────────────────────────────────────────
/**
 * GET /api/attendance/all?from=YYYY-MM-DD&to=YYYY-MM-DD&user_id=N  [admin]
 */
async function getAllAttendance(req, res) {
  try {
    const { from, to, user_id } = req.query;

    let filter = {};
    if (user_id) filter.user = user_id;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const records = await Attendance.find(filter)
      .populate('user', 'name email')
      .sort({ date: -1 });

    const mappedRecords = records.map(r => ({
      id: r._id.toString(),
      date: r.date,
      check_in_time: r.check_in_time,
      check_out_time: r.check_out_time,
      created_at: r.created_at,
      user_id: r.user ? r.user._id.toString() : null,
      user_name: r.user ? r.user.name : 'Unknown',
      user_email: r.user ? r.user.email : 'Unknown'
    }));

    return res.status(200).json({ success: true, count: mappedRecords.length, records: mappedRecords });
  } catch (err) {
    console.error('[getAllAttendance]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Admin: Get today's summary ───────────────────────────────────────────────
/**
 * GET /api/attendance/today  [admin]
 */
async function getTodayAttendance(req, res) {
  try {
    const date = today();

    const records = await Attendance.find({ date })
      .populate('user', 'name email')
      .sort({ check_in_time: 1 });

    const mappedRecords = records.map(r => ({
      id: r._id.toString(),
      date: r.date,
      check_in_time: r.check_in_time,
      check_out_time: r.check_out_time,
      user_id: r.user ? r.user._id.toString() : null,
      user_name: r.user ? r.user.name : 'Unknown',
      user_email: r.user ? r.user.email : 'Unknown'
    }));

    return res.status(200).json({
      success: true,
      date,
      total_present: mappedRecords.length,
      records: mappedRecords,
    });
  } catch (err) {
    console.error('[getTodayAttendance]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * POST /api/attendance/mark-manual
 * Body: { userId, action }
 * Admin only - marks attendance for a student manually
 */
async function markManualAttendance(req, res) {
  try {
    const { userId, action } = req.body;
    const date = today();

    if (!userId || !action) {
      return res.status(400).json({ success: false, message: 'userId and action are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let attendance = await Attendance.findOne({ user: userId, date });

    if (action === 'check_in') {
      if (attendance && attendance.check_in_time) {
        return res.status(409).json({ success: false, message: 'Already checked in.' });
      }
      if (!attendance) {
        attendance = await Attendance.create({ user: userId, date, check_in_time: nowISO() });
      } else {
        attendance.check_in_time = nowISO();
        await attendance.save();
      }
      return res.status(201).json({ success: true, message: 'Manual check-in recorded.', attendance });
    } else if (action === 'check_out') {
      if (!attendance || !attendance.check_in_time) {
        return res.status(400).json({ success: false, message: 'No check-in record found for today.' });
      }
      if (attendance.check_out_time) {
        return res.status(409).json({ success: false, message: 'Already checked out.' });
      }
      attendance.check_out_time = nowISO();
      await attendance.save();
      return res.status(200).json({ success: true, message: 'Manual check-out recorded.', attendance });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action.' });
    }
  } catch (err) {
    console.error('[markManualAttendance]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  scan,
  getMyAttendance,
  getAllAttendance,
  getTodayAttendance,
  markManualAttendance
};
