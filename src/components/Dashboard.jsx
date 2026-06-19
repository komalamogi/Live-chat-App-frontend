import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const Avatar = ({ user, size = 40, online }) => {
  if (user?.avatar) {
    return (
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <img
          src={user.avatar}
          alt={user.name}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        />
        {online !== undefined && (
          <span style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: '50%',
            background: online ? '#25D366' : '#ccc',
            border: '2px solid #fff'
          }} />
        )}
      </div>
    );
  }
  const initials = user?.name?.charAt(0).toUpperCase() || '?';
  const colors = ['#25D366', '#128C7E', '#075E54', '#34B7F1', '#ECE5DD'];
  const colorIdx = user?.name?.charCodeAt(0) % colors.length || 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: colors[colorIdx],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: size * 0.38, fontWeight: 600
      }}>
        {initials}
      </div>
      {online !== undefined && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: online ? '#25D366' : '#ccc',
          border: '2px solid #fff'
        }} />
      )}
    </div>
  );
};

export default function Dashboard({ currentUser, onSelectChat, selectedUserId, onlineUsers, onOpenSettings, onLogout, unreadCounts }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.appIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span style={styles.appName}>Live Chat App</span>
        </div>
        <button style={styles.iconBtn} onClick={onOpenSettings} title="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667781" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <svg style={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#667781" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          style={styles.searchInput}
          placeholder="Enter name to search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* User list */}
      <div style={styles.list}>
        {loading ? (
          <div style={styles.loadingWrap}>
            <div style={styles.loadDot} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No users found</div>
        ) : (
          filtered.map(user => {
            const isOnline = onlineUsers.includes(user._id);
            const unread = unreadCounts[user._id] || 0;
            const isSelected = selectedUserId === user._id;
            return (
              <button
                key={user._id}
                style={{
                  ...styles.userItem,
                  ...(isSelected ? styles.userItemSelected : {})
                }}
                onClick={() => onSelectChat(user)}
              >
                <Avatar user={user} size={46} online={isOnline} />
                <div style={styles.userInfo}>
                  <div style={styles.userRow}>
                    <span style={styles.userName}>{user.name}</span>
                    {unread > 0 && (
                      <span style={styles.badge}>{unread > 9 ? '9+' : unread}</span>
                    )}
                  </div>
                  <span style={{ ...styles.userStatus, color: isOnline ? '#25D366' : '#667781' }}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <Avatar user={currentUser} size={36} />
        <div style={styles.footerInfo}>
          <span style={styles.footerName}>{currentUser.name}</span>
          <span style={styles.footerEmail}>{currentUser.email}</span>
        </div>
        <button style={styles.logoutBtn} onClick={onLogout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: 280,
    minWidth: 260,
    height: '100vh',
    background: '#fff',
    borderRight: '1px solid #e9edef',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid #e9edef'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: '#25D366',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  appName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#111b21'
  },
  iconBtn: {
    background: 'none',
    padding: 6,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.15s'
  },
  searchWrap: {
    padding: '10px 12px',
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: 24,
    top: '50%',
    transform: 'translateY(-50%)'
  },
  searchInput: {
    width: '100%',
    background: '#f0f2f5',
    border: 'none',
    borderRadius: 8,
    padding: '8px 12px 8px 36px',
    fontSize: 13,
    color: '#111b21'
  },
  list: {
    flex: 1,
    overflowY: 'auto'
  },
  userItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    background: 'transparent',
    textAlign: 'left',
    borderBottom: '1px solid #f0f2f5',
    transition: 'background 0.15s',
    cursor: 'pointer'
  },
  userItemSelected: {
    background: '#e8faf1'
  },
  userInfo: {
    flex: 1,
    minWidth: 0
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111b21',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  badge: {
    background: '#25D366',
    color: '#fff',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
    padding: '1px 6px',
    minWidth: 18,
    textAlign: 'center'
  },
  userStatus: {
    fontSize: 12,
    display: 'block',
    marginTop: 2
  },
  loadingWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: 40
  },
  loadDot: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '3px solid #e9edef',
    borderTopColor: '#25D366',
    animation: 'spin 0.7s linear infinite'
  },
  empty: {
    textAlign: 'center',
    color: '#667781',
    fontSize: 13,
    padding: 40
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderTop: '1px solid #e9edef',
    background: '#f8f9fa'
  },
  footerInfo: {
    flex: 1,
    minWidth: 0
  },
  footerName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#111b21',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  footerEmail: {
    fontSize: 11,
    color: '#667781',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: '#ef4444',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: 8,
    flexShrink: 0
  }
};
