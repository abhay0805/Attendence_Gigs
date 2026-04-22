import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess }) => {
  // Use a random ID to ensure we never collide with a previous instance
  const [scannerId] = useState(`reader-${Math.random().toString(36).substr(2, 9)}`);
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onScanSuccess(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error("Unable to start scanning", err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop()
            .then(() => {
              scannerRef.current.clear();
            })
            .catch(err => console.error("Failed to stop scanner", err));
        }
      }
    };
  }, [onScanSuccess, scannerId]);

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div id={scannerId} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}></div>
      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Point your back camera at the admin's QR code.
      </p>
    </div>
  );
};

export default QRScanner;
