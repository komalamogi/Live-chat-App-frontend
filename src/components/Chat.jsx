import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';

const Avatar = ({ user, size = 36 }) => {
  if (user?.avatar) {
    return (
      <img src={user.avatar} alt={user.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    );
  }
  const initials = user?.name?.charAt(0).toUpperCase() || '?';
  const colors = ['#25D366', '#128C7E', '#075E54', '#34B7F1'];
  const colorIdx = user?.name?.charCodeAt(0) % colors.length || 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[colorIdx], display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.38, fontWeight: 600, flexShrink: 0
    }}>
      {initials}
    </div>
  );
};

export default function Chat({ currentUser, selectedUser, socket, isOnline, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!selectedUser) return;
    loadMessages();
    inputRef.current?.focus();
  }, [selectedUser?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      const isRelevant =
        (msg.sender._id === selectedUser?._id && msg.receiver._id === currentUser._id) ||
        (msg.sender._id === currentUser._id && msg.receiver._id === selectedUser?._id);
      if (isRelevant) {
        setMessages(prev => [...prev, msg]);
        if (msg.sender._id === selectedUser?._id) {
          socket.emit('mark_read', { senderId: selectedUser._id });
        }
      }
    };

    const handleSent = (msg) => {
      // Already handled via receive logic; avoid duplicates
    };

    const handleTypingStart = ({ senderId }) => {
      if (senderId === selectedUser?._id) setTyping(true);
    };

    const handleTypingStop = ({ senderId }) => {
      if (senderId === selectedUser?._id) setTyping(false);
    };

    socket.on('receive_message', handleReceive);
    socket.on('message_sent', handleSent);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('message_sent', handleSent);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [socket, selectedUser?._id]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/chats/messages/${selectedUser._id}`);
      setMessages(data);
      if (socket) socket.emit('mark_read', { senderId: selectedUser._id });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !socket || sending) return;

    setSending(true);
    setInput('');

    // Optimistic UI
    const tempMsg = {
      _id: `temp-${Date.now()}`,
      sender: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      receiver: { _id: selectedUser._id },
      content: text,
      createdAt: new Date().toISOString(),
      temp: true
    };
    setMessages(prev => [...prev, tempMsg]);

    socket.emit('send_message', { receiverId: selectedUser._id, content: text });

    // Replace temp message on confirmation
    socket.once('message_sent', (msg) => {
      setMessages(prev => prev.map(m => m._id === tempMsg._id ? msg : m));
      setSending(false);
      if (onMessageSent) onMessageSent(selectedUser._id);
    });

    setTimeout(() => setSending(false), 3000);

    // Stop typing
    socket.emit('typing_stop', { receiverId: selectedUser._id });
    clearTimeout(typingTimerRef.current);
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket || !selectedUser) return;
    socket.emit('typing_start', { receiverId: selectedUser._id });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing_stop', { receiverId: selectedUser._id });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let currentDate = null;
    msgs.forEach(msg => {
      const d = new Date(msg.createdAt);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (dateStr !== currentDate) {
        groups.push({ type: 'date', label: dateStr });
        currentDate = dateStr;
      }
      groups.push({ type: 'message', data: msg });
    });
    return groups;
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!selectedUser) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3 style={styles.emptyTitle}>Select a conversation</h3>
        <p style={styles.emptyText}>Choose someone from the sidebar to start chatting</p>
      </div>
    );
  }

  const grouped = groupMessagesByDate(messages);

  return (
    <div style={styles.chat}>
      {/* Chat header */}
      <div style={styles.header}>
        <Avatar user={selectedUser} size={40} />
        <div style={styles.headerInfo}>
          <span style={styles.headerName}>{selectedUser.name}</span>
          <span style={{ ...styles.headerStatus, color: isOnline ? '#25D366' : '#667781' }}>
            {typing ? 'typing...' : isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {loading ? (
          <div style={styles.loadWrap}>
            <div style={styles.loader} />
          </div>
        ) : messages.length === 0 ? (
          <div style={styles.noMessages}>
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          grouped.map((item, i) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${i}`} style={styles.dateBadge}>
                  <span style={styles.dateLabel}>{item.label}</span>
                </div>
              );
            }
            const msg = item.data;
            const isMine = msg.sender._id === currentUser._id || msg.sender === currentUser._id;
            return (
              <div key={msg._id} style={{ ...styles.msgRow, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                {!isMine && <Avatar user={selectedUser} size={28} />}
                <div style={{
                  ...styles.bubble,
                  background: isMine ? '#25D366' : '#fff',
                  color: isMine ? '#fff' : '#111b21',
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  opacity: msg.temp ? 0.75 : 1
                }}>
                  <p style={styles.msgText}>{msg.content}</p>
                  <span style={{ ...styles.msgTime, color: isMine ? 'rgba(255,255,255,0.7)' : '#667781' }}>
                    {formatTime(msg.createdAt)}
                    {isMine && (
                      <svg style={{ marginLeft: 3 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
        {typing && (
          <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
            <Avatar user={selectedUser} size={28} />
            <div style={{ ...styles.bubble, background: '#fff', borderRadius: '18px 18px 18px 4px' }}>
              <div style={styles.typingDots}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <div style={styles.inputWrap}>
          <textarea
            ref={inputRef}
            style={styles.textarea}
            placeholder="Type a message..."
            value={input}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            style={{ ...styles.sendBtn, background: input.trim() ? '#25D366' : '#ccc' }}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  chat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden'
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
    gap: 12
  },
  emptyIcon: { opacity: 0.4 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: '#111b21' },
  emptyText: { fontSize: 13, color: '#667781' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    background: '#fff',
    borderBottom: '1px solid #e9edef',
    flexShrink: 0
  },
  headerInfo: { flex: 1 },
  headerName: { display: 'block', fontSize: 15, fontWeight: 600, color: '#111b21' },
  headerStatus: { fontSize: 12 },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    background: '#e5ddd5',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9c9c9' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
  },
  loadWrap: { display: 'flex', justifyContent: 'center', paddingTop: 40 },
  loader: {
    width: 28, height: 28, borderRadius: '50%',
    border: '3px solid rgba(0,0,0,0.1)', borderTopColor: '#25D366',
    animation: 'spin 0.7s linear infinite'
  },
  noMessages: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100%', color: '#667781', fontSize: 14
  },
  dateBadge: {
    display: 'flex', justifyContent: 'center', margin: '12px 0'
  },
  dateLabel: {
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(4px)',
    padding: '3px 12px',
    borderRadius: 20,
    fontSize: 11,
    color: '#667781',
    fontWeight: 500
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 6,
    animation: 'fadeIn 0.15s ease'
  },
  bubble: {
    maxWidth: '65%',
    padding: '8px 12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  msgText: { fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
  msgTime: {
    fontSize: 10, display: 'flex', alignItems: 'center',
    justifyContent: 'flex-end', marginTop: 3, gap: 1
  },
  typingDots: {
    display: 'flex', gap: 4, padding: '2px 0',
    '& span': { width: 6, height: 6, borderRadius: '50%', background: '#ccc' }
  },
  inputArea: {
    padding: '10px 16px',
    background: '#f0f2f5',
    borderTop: '1px solid #e9edef',
    flexShrink: 0
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    background: '#fff',
    borderRadius: 24,
    padding: '4px 4px 4px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  textarea: {
    flex: 1,
    resize: 'none',
    fontSize: 14,
    lineHeight: 1.5,
    color: '#111b21',
    maxHeight: 120,
    paddingTop: 8,
    paddingBottom: 8,
    background: 'transparent'
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.2s',
    marginBottom: 1
  }
};
