import React, { useState, useContext } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [prn, setPrn] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    // Enforce @mitaoe.ac.in for students
    if (!email.toLowerCase().endsWith('@mitaoe.ac.in')) {
      setError('Only students with @mitaoe.ac.in email addresses can register.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, prn })
      });
      const data = await res.json();
      
      if (data.success) {
        // Registration successful, redirect to login
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      } else {
        setError(data.message || 'Registration failed');
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
        <h1 className="title" style={{ marginBottom: '8px' }}>Create Account</h1>
        <p className="subtitle">Join the Attendance System</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input 
            type="text" 
            className="form-control" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="John Doe"
          />
        </div>

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

        <div className="form-group">
          <label>PRN Number</label>
          <input 
            type="text" 
            className="form-control" 
            value={prn}
            onChange={(e) => setPrn(e.target.value)}
            required
            placeholder="Enter your PRN"
          />
        </div>
        
        <div className="form-group">
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

        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label>Confirm Password</label>
          <input 
            type="password" 
            className="form-control" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          <UserPlus size={20} />
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p className="subtitle" style={{ fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Log In</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Register;
