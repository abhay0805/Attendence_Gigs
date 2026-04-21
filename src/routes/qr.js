// src/routes/qr.js
const express = require('express');
const router = express.Router();
const { generateQR, toggleQR, getQRStatus } = require('../controllers/qrController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All QR management routes are admin-only
router.use(authenticateToken, requireAdmin);

router.post('/generate', generateQR);   // Create or refresh today's QR token
router.patch('/toggle', toggleQR);      // Enable / disable scanning
router.get('/status', getQRStatus);     // View today's QR state

module.exports = router;
