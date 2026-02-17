import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import VideoCard from '../components/VideoCard';
import { formatDate } from '../utils/format';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', bio: '' });

  const isOwner = currentUser?.username === username;

  useEffect(() => {
    Promise.all([
      api.get(`/api/users/${username}`),
      api.get(`/api/users/${username}/videos`),
    ])
      .then(([profileData, videoData]) => {
        setProfile(profileData.user);
        setVideos(videoData.videos);
        setEditForm({ display_name: profileData.user.display_name || '', bio: profileData.user.bio || '' });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const data = await api.put('/api/users/profile', editForm);
      setProfile((prev) => ({ ...prev, ...data.user }));
      updateUser(data.user);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const data = await api.upload('/api/users/avatar', formData);
      setProfile((prev) => ({ ...prev, avatar_url: data.user.avatar_url }));
      updateUser({ avatar_url: data.user.avatar_url });
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!profile) return <div className="error-state">User not found</div>;

  return (
    <div className="profile-page">
      <div className="profile-header card">
        <div className="profile-avatar-section">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              {(profile.display_name || profile.username)[0].toUpperCase()}
            </div>
          )}
          {isOwner && (
            <label className="avatar-upload-btn">
              Change
              <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </label>
          )}
        </div>
        <div className="profile-info">
          {editing ? (
            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <input
                type="text"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                placeholder="Display name"
              />
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Bio"
                rows={3}
              />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h1>
                {profile.display_name || profile.username}
                {profile.is_verified && <span className="verified-badge">&#10003;</span>}
              </h1>
              <p className="profile-username">@{profile.username}</p>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              <p className="profile-meta">
                <span>{profile.video_count} videos</span>
                <span>Joined {formatDate(profile.created_at)}</span>
              </p>
              {isOwner && (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit Profile</button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="profile-videos">
        <h2>Videos</h2>
        {videos.length === 0 ? (
          <div className="empty-state">
            <p>No videos yet</p>
          </div>
        ) : (
          <div className="video-grid">
            {videos.map((v) => <VideoCard key={v.id} video={{ ...v, username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url }} />)}
          </div>
        )}
      </div>
    </div>
  );
}
