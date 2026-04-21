// src/utils/time.js

/**
 * Checks if the current time in IST (Asia/Kolkata) is between 9:00 AM and 9:00 PM.
 * @returns {boolean} true if active, false otherwise
 */
function isCurrentlyActiveIST() {
  const date = new Date();
  // Format the date strictly in Asia/Kolkata timezone
  const str = date.toLocaleString("en-US", { 
    timeZone: "Asia/Kolkata", 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit'
  });
  
  // str is in "HH:MM" format (00-24)
  let [h, m] = str.split(':').map(Number);
  
  // Handle some edge cases in JS runtime formats
  if (h === 24) h = 0;

  // Active from 9:00 (inclusive) to 21:00 (exclusive)
  return h >= 9 && h < 21;
}

const STATIC_QR_TOKEN = process.env.STATIC_QR_TOKEN || "PERMANENT_ATTENDANCE_QR_CODE_V1";

module.exports = { isCurrentlyActiveIST, STATIC_QR_TOKEN };
