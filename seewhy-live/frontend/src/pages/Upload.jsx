import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Upload() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ title: '', description: '', is_public: true });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 500 * 1024 * 1024) {
        alert('File too large. Maximum size is 500MB.');
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a video file');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      // Get video duration from the file
      const duration = await getVideoDuration(file);
      if (duration > 600) {
        alert('Video must be 10 minutes or less');
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('duration', Math.round(duration).toString());
      formData.append('is_public', form.is_public.toString());

      setProgress(30);
      const data = await api.upload('/api/videos', formData);
      setProgress(100);
      navigate(`/video/${data.video.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-card card">
        <h1>Upload Video</h1>
        <form onSubmit={handleSubmit}>
          <div
            className="upload-dropzone"
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <div className="upload-file-info">
                <p className="upload-filename">{file.name}</p>
                <p className="upload-filesize">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
            ) : (
              <div className="upload-placeholder">
                <p>Click to select a video</p>
                <p className="upload-hint">MP4, WebM, or MOV - Max 500MB, 10 min</p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              hidden
            />
          </div>

          <div className="form-group">
            <label>Title *</label>
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
              rows={4}
            />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              />
              Public video
            </label>
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span>{progress}%</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={uploading || !file}>
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>
      </div>
    </div>
  );
}

function getVideoDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}
