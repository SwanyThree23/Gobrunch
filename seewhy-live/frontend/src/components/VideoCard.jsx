import { Link } from 'react-router-dom';
import { formatDuration, formatCount, formatDate } from '../utils/format';

export default function VideoCard({ video }) {
  return (
    <div className="video-card">
      <Link to={`/video/${video.id}`} className="video-card-thumbnail">
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} />
        ) : (
          <div className="thumbnail-placeholder">
            <span>&#9654;</span>
          </div>
        )}
        <span className="video-duration">{formatDuration(video.duration)}</span>
      </Link>
      <div className="video-card-info">
        <Link to={`/user/${video.username}`} className="video-card-avatar">
          {video.avatar_url ? (
            <img src={video.avatar_url} alt={video.username} />
          ) : (
            <div className="avatar-placeholder">{(video.display_name || video.username)[0].toUpperCase()}</div>
          )}
        </Link>
        <div className="video-card-details">
          <Link to={`/video/${video.id}`} className="video-card-title">{video.title}</Link>
          <Link to={`/user/${video.username}`} className="video-card-username">
            {video.display_name || video.username}
            {video.is_verified && <span className="verified-badge" title="Verified">&#10003;</span>}
          </Link>
          <div className="video-card-meta">
            <span>{formatCount(video.view_count)} views</span>
            <span>{formatDate(video.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
