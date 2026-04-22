import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { RefreshCw, Users, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [qrStatus, setQrStatus] = useState(null);
  const [todaySummary, setTodaySummary] = useState({ total_present: 0, records: [] });
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adminActionMessage, setAdminActionMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching Admin Dashboard data...');
      const [qrRes, summaryRes, usersRes] = await Promise.all([
        fetch('/api/qr/status', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/attendance/today', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const qrData = await qrRes.json();
      console.log('QR Status Data:', qrData);
      if (qrData.success) {
        setQrStatus(qrData.qr);
      }

      const summaryData = await summaryRes.json();
      console.log('Summary Data:', summaryData);
      if (summaryData.success) {
        setTodaySummary(summaryData);
      }
      
      const usersData = await usersRes.json();
      console.log('Users Data:', usersData);
      if (usersData.success) {
        setUsersList(usersData.users);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserPermission = async (userId, currentStatus) => {
    try {
      const res = await fetch(`/api/users/${userId}/permission`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ can_scan: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        // Optimistic UI update
        setUsersList(usersList.map(u => u.id === userId ? { ...u, can_scan: !currentStatus } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualMark = async (action) => {
    if (!selectedUserId) {
      setAdminActionMessage({ success: false, message: 'Please select a student first.' });
      return;
    }
    
    setAdminActionMessage(null);
    try {
      const res = await fetch('/api/attendance/mark-manual', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ userId: selectedUserId, action })
      });
      const data = await res.json();
      setAdminActionMessage({ success: data.success, message: data.message });
      if (data.success) {
        setSelectedUserId('');
        fetchData(); // Refresh summary and user list
      }
    } catch (err) {
      console.error(err);
      setAdminActionMessage({ success: false, message: 'Network error' });
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 className="title" style={{ marginBottom: '24px' }}>Admin Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{todaySummary.total_present}</div>
          <div className="stat-label">Total Present Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            <span className={`badge ${qrStatus?.is_active ? 'active' : 'inactive'}`} style={{ fontSize: '1rem', padding: '8px 16px' }}>
              {qrStatus?.is_active ? 'LIVE NOW' : 'OFFLINE'}
            </span>
          </div>
          <div className="stat-label">System Readiness</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 className="title" style={{ alignSelf: 'flex-start', marginBottom: '16px', fontSize: '1.2rem' }}>Permanent Attendance QR</h2>
          
          <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            {qrStatus?.token && (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrStatus.token}`} 
                alt="Permanent Attendance QR Code" 
                style={{ display: 'block', opacity: qrStatus?.is_active ? 1 : 0.3, transition: 'opacity 0.3s' }}
              />
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p className="subtitle" style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Clock size={16} /> 
              Active Daily: 9:00 AM — 9:00 PM IST
            </p>
            {!qrStatus?.is_active && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                Scanning is currently rejected by the system outside these hours.
              </p>
            )}
            <button className="btn btn-secondary" onClick={fetchData} style={{ marginTop: '16px', padding: '8px 16px' }}>
              <RefreshCw size={16} /> Refresh Status
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="title" style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} className="text-muted" />
            Today's Check-ins
          </h2>
          {todaySummary.records.length > 0 ? (
            <ul className="attendance-list">
              {todaySummary.records.map((record) => (
                <li key={record.user_id} className="attendance-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{record.user_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{record.user_email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem' }}>
                      IN: {new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {record.check_out_time ? (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        OUT: {new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    ) : (
                      <span className="badge inactive">working</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="subtitle" style={{ textAlign: 'center', padding: '24px' }}>No attendance records yet.</p>
          )}
        </div>

        <div className="card">
          <h2 className="title" style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Manual Attendance (by Name)</h2>
          {adminActionMessage && (
            <div className={`alert ${adminActionMessage.success ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0 }}>{adminActionMessage.message}</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select 
              className="form-control" 
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">-- Select Student --</option>
              {usersList.filter(u => u.role === 'user').map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={() => handleManualMark('check_in')}
              >
                Check In
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => handleManualMark('check_out')}
              >
                Check Out
              </button>
            </div>
          </div>
          <p className="subtitle" style={{ fontSize: '0.85rem', marginTop: '12px' }}>
            Select a student from the registered list to manually record their check-in or check-out.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 className="title" style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} className="text-muted" />
          Manage Scanning Permissions
        </h2>
        {usersList.length > 0 ? (
          <ul className="attendance-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {usersList.map((user) => (
              <li key={user.id} className="attendance-item" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{user.name} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({user.role})</span></div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{user.email}</div>
                  
                  <button 
                    onClick={() => toggleUserPermission(user.id, !!user.can_scan)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      backgroundColor: !!user.can_scan ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                      color: !!user.can_scan ? 'var(--danger)' : 'var(--success)',
                      border: `1px solid ${!!user.can_scan ? 'var(--danger)' : 'var(--success)'}`
                    }}
                  >
                    {!!user.can_scan ? 'Revoke Access' : 'Grant Access'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="subtitle" style={{ textAlign: 'center', padding: '24px' }}>No users found.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
