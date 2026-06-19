import { useState, useEffect } from 'react';
import './index.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import ProfileSettings from './components/ProfileSettings';
import { initSocket, disconnectSocket } from './services/socket';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Restore session
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
      } catch {}
    }
  }, []);

  // Init socket when authenticated
  useEffect(() => {
    if (!token) return;
    const s = initSocket(token);
    setSocket(s);

    s.on('online_users', (users) => setOnlineUsers(users));
    s.on('user_status', ({ userId, isOnline }) => {
      setOnlineUsers(prev =>
        isOnline ? [...new Set([...prev, userId])] : prev.filter(id => id !== userId)
      );
    });

    s.on('receive_message', (msg) => {
      const senderId = msg.sender._id;
      setUnreadCounts(prev => {
        if (selectedUser?._id === senderId) return prev;
        return { ...prev, [senderId]: (prev[senderId] || 0) + 1 };
      });
    });

    return () => {
      s.off('online_users');
      s.off('user_status');
      s.off('receive_message');
      disconnectSocket();
    };
  }, [token]);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    setUser(null);
    setToken(null);
    setSocket(null);
    setSelectedUser(null);
    setOnlineUsers([]);
    setUnreadCounts({});
  };

  const handleSelectChat = (selectedUserData) => {
    setSelectedUser(selectedUserData);
    // Clear unread on select
    setUnreadCounts(prev => {
      const updated = { ...prev };
      delete updated[selectedUserData._id];
      return updated;
    });
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div style={styles.app}>
      <Dashboard
        currentUser={user}
        onSelectChat={handleSelectChat}
        selectedUserId={selectedUser?._id}
        onlineUsers={onlineUsers}
        onOpenSettings={() => setShowSettings(true)}
        onLogout={handleLogout}
        unreadCounts={unreadCounts}
      />
      <Chat
        currentUser={user}
        selectedUser={selectedUser}
        socket={socket}
        isOnline={selectedUser ? onlineUsers.includes(selectedUser._id) : false}
        onMessageSent={(receiverId) => {
          // Clear unread for the user we just sent to
          setUnreadCounts(prev => { const u = { ...prev }; delete u[receiverId]; return u; });
        }}
      />
      {showSettings && (
        <ProfileSettings
          currentUser={user}
          onUpdate={handleProfileUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

const styles = {
  app: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    background: '#e5ddd5'
  }
};
