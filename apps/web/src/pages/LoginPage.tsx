import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error('First name and last name are required');
        }
        await register({ email, password, firstName: firstName.trim(), lastName: lastName.trim() });
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || (isSignUp ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  function toggleMode(signUp: boolean) {
    setIsSignUp(signUp);
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 440 }}>
        <div className="logo">🏆</div>
        <h1>DSATracker</h1>
        <p className="subtitle">
          {isSignUp ? 'Create your competitive programming account' : 'Sign in to your account'}
        </p>

        {/* Tab Selector */}
        <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: 24 }}>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 13,
              borderRadius: 'var(--radius-sm)',
              background: !isSignUp ? 'var(--gradient-accent)' : 'transparent',
              color: !isSignUp ? '#fff' : 'var(--text-secondary)',
            }}
            onClick={() => toggleMode(false)}
          >
            Sign In
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 13,
              borderRadius: 'var(--radius-sm)',
              background: isSignUp ? 'var(--gradient-accent)' : 'transparent',
              color: isSignUp ? '#fff' : 'var(--text-secondary)',
            }}
            onClick={() => toggleMode(true)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>First Name</label>
                <input
                  className="input"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Last Name</label>
                <input
                  className="input"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {isSignUp && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Must be 8+ chars with uppercase, lowercase, number & special symbol (@$!%*?&#)
              </span>
            )}
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>

          {error && <p className="login-error">{error}</p>}
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => toggleMode(false)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => toggleMode(true)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
