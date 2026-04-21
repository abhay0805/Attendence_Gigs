// src/controllers/attendanceController.js
// Core attendance scan logic and admin reporting

const db = require('../database/schema');
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
 * Flow:
 *   1. Validate current time is between 9:00 AM and 9:00 PM IST.
 *   2. Validate the token matches the static token.
 *   3. Look up today's attendance record for req.user.id.
 *      a. No record  → INSERT check-in.
 *      b. check_in only  → UPDATE check-out.
 *      c. Both exist  → reject (already completed).
 */
function scan(req, res) {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    const date = today();

    // ── 0. Validate user permission ──
    const user = db.prepare('SELECT can_scan FROM users WHERE id = ?').get(userId);
    if (!user || user.can_scan === 0) {
      return res.status(403).json({
        success: false,
        message: 'You have not been granted permission to scan the attendance QR code. Please contact the administrator.',
      });
    }

    // ── 1. Validate Time constraint (9am to 9pm IST) ──
    if (!isCurrentlyActiveIST()) {
      return res.status(403).json({
        success: false,
        message: 'QR scanning is only allowed between 9:00 AM and 9:00 PM IST.',
      });
    }

    if (!token) {
      return res.status(400).json({ success: false, message: 'QR token is required.' });
    }

    // ── 2. Validate token ──
    const { timingSafeEqual } = require('crypto');
    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(STATIC_QR_TOKEN);

    const tokenMatch =
      tokenBuffer.length === expectedBuffer.length &&
      timingSafeEqual(tokenBuffer, expectedBuffer);

    if (!tokenMatch) {
      return res.status(403).json({
        success: false,
        message: 'Invalid QR token.',
      });
    }

    // ── 3. Check existing attendance record ──
    const attendance = db
      .prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?')
      .get(userId, date);

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
      const checkOutTime = nowISO();
      db.prepare(`
        UPDATE attendance
        SET check_out_time = ?
        WHERE user_id = ? AND date = ?
      `).run(checkOutTime, userId, date);

      const updated = db
        .prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?')
        .get(userId, date);

      return res.status(200).json({
        success: true,
        message: 'Check-out recorded successfully.',
        action: 'check_out',
        attendance: updated,
      });
    }

    // ── 3a. No record → record check-in ──
    const checkInTime = nowISO();
    db.prepare(`
      INSERT INTO attendance (user_id, date, check_in_time)
      VALUES (?, ?, ?)
    `).run(userId, date, checkInTime);

    const created = db
      .prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?')
      .get(userId, date);

    return res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully.',
      action: 'check_in',
      attendance: created,
    });
  } catch (err) {
    console.error('[scan]', err);
    // Handle unique constraint violation (race condition guard)
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
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
 * Returns attendance records for the authenticated user.
 * Optional date range filters.
 */
function getMyAttendance(req, res) {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;

    let query = 'SELECT * FROM attendance WHERE user_id = ?';
    const params = [userId];

    if (from) { query += ' AND date >= ?'; params.push(from); }
    if (to)   { query += ' AND date <= ?'; params.push(to); }
    query += ' ORDER BY date DESC';

    const records = db.prepare(query).all(...params);

    return res.status(200).json({ success: true, count: records.length, records });
  } catch (err) {
    console.error('[getMyAttendance]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Admin: Get all attendance ────────────────────────────────────────────────
/**
 * GET /api/attendance/all?from=YYYY-MM-DD&to=YYYY-MM-DD&user_id=N  [admin]
 * Returns attendance joined with user info.
 */
function getAllAttendance(req, res) {
  try {
    const { from, to, user_id } = req.query;

    let query = `
      SELECT
        a.id,
        a.date,
        a.check_in_time,
        a.check_out_time,
        a.created_at,
        u.id   AS user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM attendance a
      JOIN users u ON u.id = a.user_id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) { query += ' AND a.user_id = ?'; params.push(user_id); }
    if (from)    { query += ' AND a.date >= ?';   params.push(from); }
    if (to)      { query += ' AND a.date <= ?';   params.push(to); }
    query += ' ORDER BY a.date DESC, u.name ASC';

    const records = db.prepare(query).all(...params);

    return res.status(200).json({ success: true, count: records.length, records });
  } catch (err) {
    console.error('[getAllAttendance]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ─── Admin: Get today's summary ───────────────────────────────────────────────
/**
 * GET /api/attendance/today  [admin]
 * Returns all attendance entries for today with user details.
 */
function getTodayAttendance(req, res) {
  try {
    const date = today();

    const records = db.prepare(`
      SELECT
        a.id,
        a.date,
        a.check_in_time,
        a.check_out_time,
        u.id   AS user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM attendance a
      JOIN users u ON u.id = a.user_id
      WHERE a.date = ?
      ORDER BY a.check_in_time ASC
    `).all(date);

    return res.status(200).json({
      success: true,
      date,
      total_present: records.length,
      records,
    });
  } catch (err) {
    console.error('[getTodayAttendance]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = { scan, getMyAttendance, getAllAttendance, getTodayAttendance };
