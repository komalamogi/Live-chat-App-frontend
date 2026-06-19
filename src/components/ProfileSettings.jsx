import { useState, useRef } from 'react';
import api from '../utils/api';

const Avatar = ({ user, size = 64 }) => {
  if (user?.avatar) {
    return <img src={user.avatar} alt={user.name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  const initials = user?.name?.charAt(0).toUpperCase() || '?';
  const colors = ['#25D366', '#128C7E', '#075E54', '#34B7F1'];
  const colorIdx = user?.name?.charCodeAt(0) % colors.length || 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[colorIdx], display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.38, fontWeight: 600
    }}>
      {initials}
    </div>
  );
};

export default function ProfileSettings({ currentUser, onUpdate, onClose }) {
  const [form, setForm] = useState({ name: currentUser.name, email: currentUser.email });
  const [avatar, setAvatar] = useState(currentUser.avatar || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.put('/users/profile', {
        name: form.name,
        email: form.email,
        avatar
      });
      setSuccess('Profile updated!');
      onUpdate(data);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const previewUser = { ...currentUser, name: form.name, avatar };

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Profile Settings</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667781" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={styles.body}>
          {/* Avatar section */}
          <div style={styles.avatarSection}>
            <Avatar user={previewUser} size={80} />
            <div style={styles.avatarOverlay} onClick={() => fileRef.current.click()}>
              <Avatar user={previewUser} size={80} />
              <div style={styles.cameraOverlay}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            <p style={styles.avatarHint}>Click the camera icon to change avatar</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          {/* Form */}
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input
              style={styles.input}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={{ ...styles.input, background: '#f8f9fa', color: '#667781' }}
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.successMsg}>{success}</div>}

          <div style={styles.actions}>
            <button
              style={{ ...styles.updateBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
            <button style={styles.cancelBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(2px)'
  },
  modal: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'fadeIn 0.2s ease'
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 20px', borderBottom: '1px solid #e9edef'
  },
  title: { fontSize: 17, fontWeight: 700, color: '#111b21' },
  closeBtn: { background: 'none', padding: 4, display: 'flex', borderRadius: 6 },
  body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  avatarSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  avatarOverlay: {
    position: 'relative', cursor: 'pointer', borderRadius: '50%',
    marginTop: -88 // overlap with first avatar (shows as preview)
  },
  cameraOverlay: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    background: 'rgba(0,0,0,0.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    opacity: 0, transition: 'opacity 0.2s',
    ':hover': { opacity: 1 }
  },
  avatarHint: { fontSize: 12, color: '#25D366', marginTop: 4 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#667781' },
  input: {
    border: '1px solid #e9edef', borderRadius: 10,
    padding: '11px 14px', fontSize: 14, color: '#111b21',
    background: '#fff', transition: 'border-color 0.2s'
  },
  error: {
    background: '#fef2f2', color: '#ef4444', padding: '10px 14px',
    borderRadius: 8, fontSize: 13, border: '1px solid #fecaca'
  },
  successMsg: {
    background: '#f0fdf4', color: '#16a34a', padding: '10px 14px',
    borderRadius: 8, fontSize: 13, border: '1px solid #bbf7d0'
  },
  actions: { display: 'flex', gap: 10, marginTop: 4 },
  updateBtn: {
    flex: 1, background: '#25D366', color: '#fff', fontWeight: 600,
    fontSize: 14, padding: '12px', borderRadius: 10
  },
  cancelBtn: {
    flex: 1, background: '#ef4444', color: '#fff', fontWeight: 600,
    fontSize: 14, padding: '12px', borderRadius: 10
  }
};
