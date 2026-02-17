import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import RoomCard from '../components/RoomCard';

export default function LiveRooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    max_participants: 16,
    is_private: false,
    enable_paywall: false,
    paywall_amount: '',
    enable_audio_only: false,
  });

  useEffect(() => {
    api.get('/api/rooms')
      .then((data) => setRooms(data.rooms))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = await api.post('/api/rooms', {
        ...form,
        paywall_amount: form.enable_paywall ? parseFloat(form.paywall_amount) : undefined,
      });
      navigate(`/room/${data.room.id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="live-rooms-page">
      <div className="feed-header">
        <h1>Live Rooms</h1>
        {user && (
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : 'Create Room'}
          </button>
        )}
      </div>

      {showCreate && (
        <form className="create-room-form card" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Room Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={200}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Max Participants (2-16)</label>
              <input
                type="number"
                min={2}
                max={16}
                value={form.max_participants}
                onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value, 10) })}
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.is_private}
                  onChange={(e) => setForm({ ...form, is_private: e.target.checked })}
                />
                Private Room
              </label>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.enable_audio_only}
                  onChange={(e) => setForm({ ...form, enable_audio_only: e.target.checked })}
                />
                Audio Only
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.enable_paywall}
                onChange={(e) => setForm({ ...form, enable_paywall: e.target.checked })}
              />
              Enable Paywall
            </label>
            {form.enable_paywall && (
              <input
                type="number"
                min={0.01}
                step={0.01}
                placeholder="Amount (USD)"
                value={form.paywall_amount}
                onChange={(e) => setForm({ ...form, paywall_amount: e.target.value })}
                required
              />
            )}
          </div>
          <button type="submit" className="btn btn-primary">Go Live</button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <h2>No live rooms</h2>
          <p>Be the first to go live!</p>
        </div>
      ) : (
        <div className="room-grid">
          {rooms.map((r) => <RoomCard key={r.id} room={r} />)}
        </div>
      )}
    </div>
  );
}
