'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const success = login(email, password);
      if (!success) {
        setError('Email atau password salah');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-card slide-up">
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
        <h1>Alumni Tracker</h1>
        <p className="subtitle">Universitas Muhammadiyah Malang</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              className="form-input"
              placeholder="Email admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Masuk'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 24 }}>
          Default: admin@umm.ac.id / admin123
        </p>
      </div>
    </div>
  );
}
