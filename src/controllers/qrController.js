// Admin endpoints for managing the static QR token

const { isCurrentlyActiveIST, STATIC_QR_TOKEN } = require('../utils/time');

/**
 * Returns today's date as a YYYY-MM-DD string (server local date).
 */
function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Get Static QR status ────────────────────────────────────────────────────
/**
 * GET /api/qr/status  [admin only]
 * Returns the static QR entry. It is only active between 9am and 9pm IST.
 */
function getQRStatus(req, res) {
  try {
    const is_active = isCurrentlyActiveIST();
    
    return res.status(200).json({ 
      success: true, 
      qr: {
        token: STATIC_QR_TOKEN,
        is_active,
        date: today()
      }
    });
  } catch (err) {
    console.error('[getQRStatus]', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// Legacy endpoints disabled
function generateQR(req, res) {
  return res.status(400).json({ success: false, message: 'Dynamic QR is disabled. Using static QR logic.' });
}
function toggleQR(req, res) {
  return res.status(400).json({ success: false, message: 'Dynamic QR is disabled. Using static QR logic.' });
}

module.exports = { getQRStatus, generateQR, toggleQR };
