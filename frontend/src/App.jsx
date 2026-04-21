import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppContent = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <Router>
      {user && (
        <nav className="navbar">
          <div className="title" style={{ marginBottom: 0 }}>AttendanceSystem</div>
          <div className="nav-links">
            <span className="subtitle" style={{ fontSize: '0.9rem' }}>{user.name} ({user.role})</span>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
              Logout
            </button>
          </div>
        </nav>
      )}
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
