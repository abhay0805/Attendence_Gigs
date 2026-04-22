import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess }) => {
  useEffect(() => {
    const scannerId = "reader";
    const html5QrCode = new Html5Qrcode(scannerId);

    const startScanner = async () => {
      try {
        // Ensure the element is empty before starting
        const container = document.getElementById(scannerId);
        if (container) container.innerHTML = "";

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
      // Aggressive cleanup on unmount
      if (html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => {
            html5QrCode.clear();
            const container = document.getElementById(scannerId);
            if (container) container.innerHTML = "";
          })
          .catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [onScanSuccess]);

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div id="reader" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}></div>
      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Point your back camera at the admin's QR code.
      </p>
    </div>
  );
};

export default QRScanner;
