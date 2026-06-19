import { useState } from 'react';
import api from '../utils/api';

export default function Login({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const payload = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h1 style={styles.title}>Live Chat App</h1>
          <p style={styles.subtitle}>Connect and chat in real time</p>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'login' ? styles.tabActive : {}) }}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'register' ? styles.tabActive : {}) }}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        <div style={styles.form}>
          {tab === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Name</label>
              <input
                style={styles.input}
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passWrap}>
              <input
                style={{ ...styles.input, paddingRight: 44 }}
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
              <button style={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              tab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </div>

        <p style={styles.footer}>Real-time messaging powered by Socket.io</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    padding: 16
  },
  card: {
    background: '#1e2535',
    borderRadius: 16,
    padding: '32px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
  },
  brand: {
    textAlign: 'center',
    marginBottom: 28
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: '#25D366',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px'
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4
  },
  subtitle: {
    color: '#8892a4',
    fontSize: 13
  },
  tabs: {
    display: 'flex',
    background: '#252d3d',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24
  },
  tab: {
    flex: 1,
    padding: '9px 0',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#8892a4',
    background: 'transparent',
    transition: 'all 0.2s'
  },
  tabActive: {
    background: '#25D366',
    color: '#fff'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  label: {
    color: '#c9d1d9',
    fontSize: 13,
    fontWeight: 500
  },
  input: {
    background: '#252d3d',
    border: '1px solid #334155',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 14,
    color: '#e6edf3',
    width: '100%',
    transition: 'border-color 0.2s'
  },
  passWrap: {
    position: 'relative'
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    padding: 4,
    display: 'flex',
    alignItems: 'center'
  },
  error: {
    background: '#3d1515',
    color: '#f87171',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    border: '1px solid #7f1d1d'
  },
  submitBtn: {
    background: '#25D366',
    color: '#fff',
    fontWeight: 600,
    fontSize: 15,
    padding: '13px',
    borderRadius: 10,
    marginTop: 4,
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48
  },
  spinner: {
    width: 20,
    height: 20,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block'
  },
  footer: {
    textAlign: 'center',
    color: '#4a5568',
    fontSize: 12,
    marginTop: 20
  }
};
