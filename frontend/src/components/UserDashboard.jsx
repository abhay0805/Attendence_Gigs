import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Camera, Calendar, Clock, CheckCircle } from 'lucide-react';
import QRScanner from './QRScanner';

const UserDashboard = () => {
  const { token } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/attendance/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const todayRecord = records.find(r => r.date === new Date().toISOString().slice(0, 10));

  const handleScanSuccess = async (qrData) => {
    if (processing || scanResult?.success) return;
    
    setProcessing(true);
    console.log('Scanned QR Data:', qrData);
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ token: qrData })
      });
      const data = await res.json();
      console.log('Scan API Response:', data);
      
      setScanResult({
        success: data.success,
        message: data.message
      });

      if (data.success) {
        fetchRecords();
        // Hide scanner after a delay to ensure user sees success message
        setTimeout(() => {
          setShowScanner(false);
          setScanResult(null);
        }, 2500);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="title" style={{ margin: 0 }}>My Dashboard</h1>
        <button 
          className="btn btn-primary" 
          style={{ width: 'auto' }}
          onClick={() => {
            setShowScanner(!showScanner);
            setScanResult(null);
          }}
        >
          <Camera size={18} />
          {showScanner ? 'Close Scanner' : 'Scan QR'}
        </button>
      </div>

      {showScanner && (
        <div className="card animate-in" style={{ marginBottom: '24px' }}>
          <h2 className="title" style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Scan Daily QR Code</h2>
          {scanResult && (
            <div className={`alert ${scanResult.success ? 'alert-success' : 'alert-error'}`}>
              {scanResult.success ? <CheckCircle size={20} /> : <Camera size={20} />}
              <p style={{ margin: 0 }}>{scanResult.message}</p>
            </div>
          )}
          {!scanResult && (
            <QRScanner onScanSuccess={handleScanSuccess} />
          )}
          {scanResult && !scanResult.success && (
            <button 
              className="btn btn-primary" 
              style={{ marginTop: '16px' }}
              onClick={() => setScanResult(null)}
            >
              Try Again
            </button>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="title" style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} className="text-muted" />
          Attendance History
        </h2>
        
        {records.length > 0 ? (
          <ul className="attendance-list">
            {records.map((record) => (
              <li key={record.id} className="attendance-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    background: 'var(--bg-color)', 
                    padding: '8px 12px', 
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontWeight: 600,
                    minWidth: '100px',
                    textAlign: 'center'
                  }}>
                    {new Date(record.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric'})}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} className="text-muted" />
                    <span style={{ fontSize: '0.9rem' }}>
                      IN: {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} className="text-muted" />
                    <span style={{ fontSize: '0.9rem', color: record.check_out_time ? 'inherit' : 'var(--text-muted)' }}>
                      OUT: {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'working'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="subtitle" style={{ textAlign: 'center', padding: '24px' }}>No records found. Scan a QR code to check in.</p>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
