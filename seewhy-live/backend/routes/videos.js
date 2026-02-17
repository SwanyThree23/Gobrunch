const express = require('express');
const db = require('../../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadVideo, uploadThumbnail } = require('../middleware/upload');

const router = express.Router();

// GET /api/videos - Public feed
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'recent' } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, parseInt(limit, 10));
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));

    let orderBy = 'vp.created_at DESC';
    if (sort === 'popular') orderBy = 'COALESCE(view_count, 0) DESC';
    if (sort === 'trending') orderBy = 'COALESCE(recent_views, 0) DESC';

    const result = await db.query(
      `SELECT vp.id, vp.title, vp.description, vp.video_url, vp.hls_url, vp.duration,
              vp.width, vp.height, vp.status, vp.created_at,
              u.id AS user_id, u.username, u.display_name, u.avatar_url, u.is_verified,
              COALESCE(vw.view_count, 0)::int AS view_count,
              COALESCE(vl.like_count, 0)::int AS like_count,
              vt.thumbnail_url,
              CASE WHEN EXISTS(SELECT 1 FROM video_likes WHERE video_id = vp.id AND user_id = $3) THEN true ELSE false END AS is_liked
       FROM video_posts vp
       JOIN users u ON vp.user_id = u.id
       LEFT JOIN (SELECT video_id, COUNT(*) AS view_count FROM video_views GROUP BY video_id) vw ON vp.id = vw.video_id
       LEFT JOIN (SELECT video_id, COUNT(*) AS like_count FROM video_likes GROUP BY video_id) vl ON vp.id = vl.video_id
       LEFT JOIN (SELECT video_id, COUNT(*) AS recent_views FROM video_views WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY video_id) rv ON vp.id = rv.video_id
       LEFT JOIN video_thumbnails vt ON vp.id = vt.video_id AND vt.is_primary = TRUE
       WHERE vp.is_public = TRUE AND vp.status = 'ready'
       ORDER BY ${orderBy}
       LIMIT $1 OFFSET $2`,
      [safeLimit, offset, req.user?.id || null]
    );

    const countResult = await db.query(
      "SELECT COUNT(*) FROM video_posts WHERE is_public = TRUE AND status = 'ready'"
    );

    res.json({
      videos: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10),
      limit: safeLimit,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/videos/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT vp.*, u.username, u.display_name, u.avatar_url, u.is_verified,
              COALESCE(vw.view_count, 0)::int AS view_count,
              COALESCE(vl.like_count, 0)::int AS like_count,
              CASE WHEN EXISTS(SELECT 1 FROM video_likes WHERE video_id = vp.id AND user_id = $2) THEN true ELSE false END AS is_liked
       FROM video_posts vp
       JOIN users u ON vp.user_id = u.id
       LEFT JOIN (SELECT video_id, COUNT(*) AS view_count FROM video_views GROUP BY video_id) vw ON vp.id = vw.video_id
       LEFT JOIN (SELECT video_id, COUNT(*) AS like_count FROM video_likes GROUP BY video_id) vl ON vp.id = vl.video_id
       WHERE vp.id = $1`,
      [req.params.id, req.user?.id || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const thumbnails = await db.query(
      'SELECT id, thumbnail_url, position, is_primary FROM video_thumbnails WHERE video_id = $1 ORDER BY position',
      [req.params.id]
    );

    res.json({ video: { ...result.rows[0], thumbnails: thumbnails.rows } });
  } catch (err) {
    next(err);
  }
});

// POST /api/videos - Upload video
router.post('/', authenticate, uploadVideo.single('video'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const { title, description, duration, is_public = true } = req.body;
    if (!title || !duration) {
      return res.status(400).json({ error: 'Title and duration are required' });
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`;
    const result = await db.query(
      `INSERT INTO video_posts (user_id, title, description, video_url, original_filename, mime_type, file_size, duration, is_public, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ready')
       RETURNING *`,
      [req.user.id, title, description, videoUrl, req.file.originalname, req.file.mimetype, req.file.size, parseInt(duration, 10), is_public !== 'false']
    );

    res.status(201).json({ video: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/videos/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { title, description, is_public } = req.body;
    const result = await db.query(
      `UPDATE video_posts SET title = COALESCE($1, title), description = COALESCE($2, description), is_public = COALESCE($3, is_public)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title, description, is_public, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found or unauthorized' });
    }

    res.json({ video: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/videos/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM video_posts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found or unauthorized' });
    }

    res.json({ message: 'Video deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/videos/:id/like
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    await db.query(
      'INSERT INTO video_likes (video_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, req.user.id]
    );
    res.json({ liked: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/videos/:id/like
router.delete('/:id/like', authenticate, async (req, res, next) => {
  try {
    await db.query(
      'DELETE FROM video_likes WHERE video_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ liked: false });
  } catch (err) {
    next(err);
  }
});

// POST /api/videos/:id/view
router.post('/:id/view', optionalAuth, async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const { watch_duration = 0 } = req.body;
    await db.query(
      'INSERT INTO video_views (video_id, user_id, ip_address, user_agent, watch_duration) VALUES ($1, $2, $3, $4, $5)',
      [req.params.id, req.user?.id || null, ip, req.headers['user-agent'], watch_duration]
    );
    res.json({ recorded: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/videos/:id/thumbnail
router.post('/:id/thumbnail', authenticate, uploadThumbnail.single('thumbnail'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Thumbnail image is required' });
    }

    const video = await db.query('SELECT id FROM video_posts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (video.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found or unauthorized' });
    }

    // Set all existing thumbnails to non-primary
    await db.query('UPDATE video_thumbnails SET is_primary = FALSE WHERE video_id = $1', [req.params.id]);

    const thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
    const result = await db.query(
      'INSERT INTO video_thumbnails (video_id, thumbnail_url, position, is_primary) VALUES ($1, $2, 0, TRUE) RETURNING *',
      [req.params.id, thumbnailUrl]
    );

    res.status(201).json({ thumbnail: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
