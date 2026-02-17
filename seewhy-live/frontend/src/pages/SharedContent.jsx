import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function SharedContent() {
  const { token } = useParams();
  const [share, setShare] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/shares/${token}`)
      .then((data) => {
        setShare(data.share);
        setContent(data.content);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!content) return <div className="error-state">Content not found</div>;

  return (
    <div className="shared-page">
      {share.content_type === 'video' && (
        <div className="shared-video">
          <video src={content.video_url} controls className="video-player" />
          <h1>{share.custom_title || content.title}</h1>
          <p>{share.custom_description || content.description}</p>
          <Link to={`/video/${share.content_id}`} className="btn btn-primary">
            Watch on SeeWhy LIVE
          </Link>
        </div>
      )}
      {share.content_type === 'room' && (
        <div className="shared-room">
          <h1>{share.custom_title || content.title}</h1>
          <p>{content.description}</p>
          <p>Hosted by {content.host_display_name || content.host_username}</p>
          {content.is_active ? (
            <Link to={`/room/${share.content_id}`} className="btn btn-primary">
              Join Room
            </Link>
          ) : (
            <p className="muted">This room has ended</p>
          )}
        </div>
      )}
      {share.content_type === 'profile' && (
        <div className="shared-profile">
          <h1>{content.display_name || content.username}</h1>
          <p>@{content.username}</p>
          {content.bio && <p>{content.bio}</p>}
          <Link to={`/user/${content.username}`} className="btn btn-primary">
            View Profile
          </Link>
        </div>
      )}
    </div>
  );
}
