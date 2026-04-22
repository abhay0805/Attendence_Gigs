import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ID = "qr-scanner-container";

const QRScanner = ({ onScanSuccess }) => {
  const isProcessingRef = useRef(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Clean up any existing scanner element content first
    const element = document.getElementById(SCANNER_ID);
    if (element) element.innerHTML = '';

    const html5QrCode = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 5, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        // Guard: only process ONE scan, then immediately stop the camera
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        // Stop camera immediately to prevent further scans
        try {
          if (html5QrCode.isScanning) {
            await html5QrCode.stop();
          }
        } catch (e) {
          // Ignore stop errors
        }

        // Now call the parent handler with the scanned data
        onScanSuccess(decodedText);
      },
      () => {} // Ignore QR not found errors
    ).catch(err => console.error("Unable to start scanner:", err));

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []); // Empty deps - only run once on mount

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div
        id={SCANNER_ID}
        style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}
      />
      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Point your camera at the admin's QR code.
      </p>
    </div>
  );
};

export default QRScanner;
