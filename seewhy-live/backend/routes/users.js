const express = require('express');
const db = require('../../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

const router = express.Router();

// GET /api/users/:username - Get user profile
router.get('/:username', optionalAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, u.is_verified, u.created_at,
              COALESCE(vc.video_count, 0)::int AS video_count
       FROM users u
       LEFT JOIN (SELECT user_id, COUNT(*) AS video_count FROM video_posts WHERE status = 'ready' AND is_public = TRUE GROUP BY user_id) vc ON u.id = vc.user_id
       WHERE u.username = $1 AND u.is_active = TRUE`,
      [req.params.username.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:username/videos
router.get('/:username/videos', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const user = await db.query('SELECT id FROM users WHERE username = $1', [req.params.username.toLowerCase()]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.rows[0].id;
    const isOwner = req.user?.id === userId;

    const result = await db.query(
      `SELECT vp.id, vp.title, vp.description, vp.video_url, vp.duration, vp.status, vp.is_public, vp.created_at,
              COALESCE(vw.view_count, 0)::int AS view_count,
              COALESCE(vl.like_count, 0)::int AS like_count,
              vt.thumbnail_url
       FROM video_posts vp
       LEFT JOIN (SELECT video_id, COUNT(*) AS view_count FROM video_views GROUP BY video_id) vw ON vp.id = vw.video_id
       LEFT JOIN (SELECT video_id, COUNT(*) AS like_count FROM video_likes GROUP BY video_id) vl ON vp.id = vl.video_id
       LEFT JOIN video_thumbnails vt ON vp.id = vt.video_id AND vt.is_primary = TRUE
       WHERE vp.user_id = $1 ${isOwner ? '' : "AND vp.is_public = TRUE AND vp.status = 'ready'"}
       ORDER BY vp.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit, 10), offset]
    );

    res.json({ videos: result.rows });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile - Update profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { display_name, bio } = req.body;

    const result = await db.query(
      `UPDATE users SET display_name = COALESCE($1, display_name), bio = COALESCE($2, bio)
       WHERE id = $3
       RETURNING id, username, email, display_name, avatar_url, bio, is_verified`,
      [display_name, bio, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/avatar - Upload avatar
router.post('/avatar', authenticate, uploadAvatar.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Avatar image is required' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const result = await db.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, avatar_url',
      [avatarUrl, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:username/analytics - Creator analytics
router.get('/:username/analytics', authenticate, async (req, res, next) => {
  try {
    const user = await db.query('SELECT id FROM users WHERE username = $1', [req.params.username.toLowerCase()]);
    if (user.rows.length === 0 || user.rows[0].id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const videoAnalytics = await db.query(
      'SELECT * FROM video_analytics WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    const earnings = await db.query(
      'SELECT * FROM user_earnings WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      videos: videoAnalytics.rows,
      earnings: earnings.rows[0] || { total_earnings: 0 },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
