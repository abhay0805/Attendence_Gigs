import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    let isMounted = true;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (onScanSuccess) onScanSuccess(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error("Unable to start scanning", err);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [onScanSuccess]);

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div id="reader" style={{ borderRadius: '8px', overflow: 'hidden' }}></div>
      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Point your back camera at the admin's QR code.
      </p>
    </div>
  );
};

export default QRScanner;
