import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear state after reading it
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        login(data.user, data.token);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-in" style={{ maxWidth: '400px', margin: '60px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 className="title" style={{ marginBottom: '8px' }}>Welcome Back</h1>
        <p className="subtitle">Sign in to your account</p>
      </div>

      {success && (
        <div className="alert alert-success">
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            className="form-control" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label>Password</label>
          <input 
            type="password" 
            className="form-control" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          <LogIn size={20} />
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p className="subtitle" style={{ fontSize: '0.9rem' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Register Here</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
