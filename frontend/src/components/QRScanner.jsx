import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: {width: 250, height: 250} },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Handle success
        if (onScanSuccess) {
          onScanSuccess(decodedText);
        }
        // Optional: stop scanning after success
        // scanner.clear();
      },
      (error) => {
        // Handle error (mostly just failing to find QR frame by frame, ignore)
      }
    );

    // Cleanup on unmount
    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [onScanSuccess]);

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div id="reader" ref={scannerRef}></div>
      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Point your camera at the screen to scan the daily QR code.
      </p>
    </div>
  );
};

export default QRScanner;
