import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

export default function RoomCard({ room }) {
  return (
    <div className="room-card">
      <Link to={`/room/${room.id}`} className="room-card-inner">
        <div className="room-card-header">
          <span className="live-badge">LIVE</span>
          {room.enable_paywall && (
            <span className="paywall-badge">{formatCurrency(room.paywall_amount)}</span>
          )}
          {room.enable_audio_only && <span className="audio-badge">Audio Only</span>}
        </div>
        <h3 className="room-card-title">{room.title}</h3>
        {room.description && <p className="room-card-desc">{room.description}</p>}
        <div className="room-card-footer">
          <div className="room-card-host">
            {room.host_avatar_url ? (
              <img src={room.host_avatar_url} alt="" className="room-host-avatar" />
            ) : (
              <div className="avatar-placeholder sm">{(room.host_display_name || room.host_username)[0].toUpperCase()}</div>
            )}
            <span>{room.host_display_name || room.host_username}</span>
            {room.host_verified && <span className="verified-badge">&#10003;</span>}
          </div>
          <div className="room-card-participants">
            <span>{room.participant_count}/{room.max_participants}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
