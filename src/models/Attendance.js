// src/models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // format: YYYY-MM-DD
    required: true,
  },
  check_in_time: {
    type: String,
  },
  check_out_time: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for uniqueness: user and date
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
