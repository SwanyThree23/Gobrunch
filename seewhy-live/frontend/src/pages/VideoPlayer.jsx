import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCount, formatDate, formatDuration } from '../utils/format';

export default function VideoPlayer() {
  const { id } = useParams();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    api.get(`/api/videos/${id}`)
      .then((data) => {
        setVideo(data.video);
        setLiked(data.video.is_liked);
        setLikeCount(data.video.like_count);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Record view
    api.post(`/api/videos/${id}/view`, { watch_duration: 0 }).catch(() => {});
  }, [id]);

  const handleLike = async () => {
    if (!user) return;
    try {
      if (liked) {
        await api.delete(`/api/videos/${id}/like`);
        setLiked(false);
        setLikeCount((c) => c - 1);
      } else {
        await api.post(`/api/videos/${id}/like`);
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    if (!user) return;
    try {
      const data = await api.post('/api/shares', {
        content_id: id,
        content_type: 'video',
        platform: 'link',
      });
      const shareUrl = `${window.location.origin}/share/${data.share.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!video) return <div className="error-state">Video not found</div>;

  return (
    <div className="video-player-page">
      <div className="video-player-container">
        <video
          ref={videoRef}
          src={video.video_url}
          controls
          autoPlay
          className="video-player"
        />
      </div>
      <div className="video-info">
        <h1 className="video-title">{video.title}</h1>
        <div className="video-meta-bar">
          <div className="video-stats">
            <span>{formatCount(video.view_count)} views</span>
            <span>{formatDate(video.created_at)}</span>
            <span>{formatDuration(video.duration)}</span>
          </div>
          <div className="video-actions">
            <button
              className={`btn btn-sm ${liked ? 'btn-primary' : 'btn-ghost'}`}
              onClick={handleLike}
            >
              {liked ? 'Liked' : 'Like'} ({formatCount(likeCount)})
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleShare}>Share</button>
          </div>
        </div>
        <div className="video-creator">
          <Link to={`/user/${video.username}`} className="creator-info">
            {video.avatar_url ? (
              <img src={video.avatar_url} alt="" className="creator-avatar" />
            ) : (
              <div className="avatar-placeholder">{(video.display_name || video.username)[0].toUpperCase()}</div>
            )}
            <div>
              <span className="creator-name">
                {video.display_name || video.username}
                {video.is_verified && <span className="verified-badge">&#10003;</span>}
              </span>
              <span className="creator-username">@{video.username}</span>
            </div>
          </Link>
        </div>
        {video.description && <p className="video-description">{video.description}</p>}
      </div>
    </div>
  );
}
