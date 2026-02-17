import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { io } from 'socket.io-client';

export default function Room() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    api.get(`/api/rooms/${id}`)
      .then((data) => {
        setRoom(data.room);
        setParticipants(data.participants);
        setHasAccess(!data.room.enable_paywall || data.has_paywall_access);
      })
      .catch(() => navigate('/live'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!user || !room || !hasAccess) return;

    const token = localStorage.getItem('token');
    const socket = io({ auth: { token } });
    socketRef.current = socket;

    socket.emit('room:join', id);

    socket.on('room:user-joined', (data) => {
      setParticipants((prev) => [...prev, data]);
    });

    socket.on('room:user-left', (data) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    });

    socket.on('room:chat', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('room:user-mute-changed', ({ userId, isMuted: muted }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.user_id === userId ? { ...p, is_muted: muted } : p))
      );
    });

    return () => {
      socket.emit('room:leave', id);
      socket.disconnect();
    };
  }, [user, room, hasAccess, id]);

  const handleJoin = async () => {
    try {
      await api.post(`/api/rooms/${id}/join`);
      setHasAccess(true);
    } catch (err) {
      if (err.status === 402) {
        alert(`Payment of $${room.paywall_amount} required to join this room.`);
      } else {
        alert(err.message);
      }
    }
  };

  const handleLeave = async () => {
    await api.post(`/api/rooms/${id}/leave`).catch(console.error);
    navigate('/live');
  };

  const handleEndRoom = async () => {
    if (confirm('End this room for everyone?')) {
      await api.put(`/api/rooms/${id}/end`).catch(console.error);
      navigate('/live');
    }
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('room:chat', { roomId: id, message: chatInput });
    setChatInput('');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    socketRef.current?.emit('room:toggle-mute', { roomId: id, isMuted: !isMuted });
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    socketRef.current?.emit('room:toggle-video', { roomId: id, isVideoOff: !isVideoOff });
  };

  if (loading) return <div className="loading">Loading room...</div>;
  if (!room) return <div className="error-state">Room not found</div>;

  if (!room.is_active) {
    return (
      <div className="room-ended">
        <h2>This room has ended</h2>
        <button className="btn btn-primary" onClick={() => navigate('/live')}>Browse Rooms</button>
      </div>
    );
  }

  return (
    <div className="room-page">
      <div className="room-main">
        <div className="room-header">
          <div>
            <h1>{room.title}</h1>
            {room.description && <p className="room-desc">{room.description}</p>}
          </div>
          <div className="room-header-actions">
            {user && room.host_user_id === user.id && (
              <button className="btn btn-danger btn-sm" onClick={handleEndRoom}>End Room</button>
            )}
            {user && hasAccess && (
              <button className="btn btn-ghost btn-sm" onClick={handleLeave}>Leave</button>
            )}
          </div>
        </div>

        <div className="room-panels">
          {participants.map((p) => (
            <div key={p.user_id || p.userId} className="room-panel">
              <div className="panel-video-placeholder">
                <span>{(p.display_name || p.username || '?')[0].toUpperCase()}</span>
              </div>
              <div className="panel-info">
                <span className="panel-name">{p.display_name || p.username}</span>
                <span className={`panel-role role-${p.role || 'viewer'}`}>{p.role || 'viewer'}</span>
                {p.is_muted && <span className="muted-icon" title="Muted">M</span>}
              </div>
            </div>
          ))}
        </div>

        {user && hasAccess && (
          <div className="room-controls">
            <button className={`btn ${isMuted ? 'btn-danger' : 'btn-ghost'}`} onClick={toggleMute}>
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button className={`btn ${isVideoOff ? 'btn-danger' : 'btn-ghost'}`} onClick={toggleVideo}>
              {isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
            </button>
          </div>
        )}

        {!user && (
          <div className="room-join-prompt">
            <p>Login to participate in this room</p>
          </div>
        )}

        {user && !hasAccess && (
          <div className="room-join-prompt">
            <button className="btn btn-primary" onClick={handleJoin}>
              {room.enable_paywall ? `Pay $${room.paywall_amount} to Join` : 'Join Room'}
            </button>
          </div>
        )}
      </div>

      <div className="room-chat">
        <h3>Chat</h3>
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className="chat-message">
              <strong>{m.username}:</strong> {m.message}
            </div>
          ))}
        </div>
        {user && hasAccess && (
          <form className="chat-input" onSubmit={sendChat}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit" className="btn btn-primary btn-sm">Send</button>
          </form>
        )}
      </div>
    </div>
  );
}
