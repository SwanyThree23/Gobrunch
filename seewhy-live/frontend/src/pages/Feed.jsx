import { useState, useEffect } from 'react';
import api from '../utils/api';
import VideoCard from '../components/VideoCard';

export default function Feed() {
  const [videos, setVideos] = useState([]);
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/videos?page=${page}&limit=20&sort=${sort}`)
      .then((data) => {
        setVideos(data.videos);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, sort]);

  return (
    <div className="feed-page">
      <div className="feed-header">
        <h1>Discover</h1>
        <div className="feed-sort">
          {['recent', 'popular', 'trending'].map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${sort === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setSort(s); setPage(1); }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading videos...</div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <h2>No videos yet</h2>
          <p>Be the first to upload a video!</p>
        </div>
      ) : (
        <>
          <div className="video-grid">
            {videos.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
          {total > 20 && (
            <div className="pagination">
              <button
                className="btn btn-ghost"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>Page {page} of {Math.ceil(total / 20)}</span>
              <button
                className="btn btn-ghost"
                disabled={page * 20 >= total}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
