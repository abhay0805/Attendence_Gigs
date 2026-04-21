// server.js – Application entry point

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// ── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./src/routes/auth'));
app.use('/api/attendance', require('./src/routes/attendance'));
app.use('/api/qr',         require('./src/routes/qr'));
app.use('/api/users',      require('./src/routes/users'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[UnhandledError]', err);
  res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀  Attendance API running → http://localhost:${PORT}`);
  console.log(`📋  Health check         → http://localhost:${PORT}/health\n`);
});

module.exports = app;
