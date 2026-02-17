const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/shares - Create share link
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { content_id, content_type, platform, custom_title, custom_description } = req.body;

    if (!content_id || !content_type) {
      return res.status(400).json({ error: 'content_id and content_type are required' });
    }

    if (!['video', 'room', 'profile'].includes(content_type)) {
      return res.status(400).json({ error: 'Invalid content_type' });
    }

    const shareToken = uuidv4().substring(0, 12);

    const result = await db.query(
      `INSERT INTO share_links (content_id, content_type, share_token, created_by, platform, custom_title, custom_description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [content_id, content_type, shareToken, req.user.id, platform, custom_title, custom_description]
    );

    res.status(201).json({ share: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/shares/:token - Get shared content
router.get('/:token', async (req, res, next) => {
  try {
    const share = await db.query(
      'SELECT * FROM share_links WHERE share_token = $1 AND is_active = TRUE',
      [req.params.token]
    );

    if (share.rows.length === 0) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    const shareData = share.rows[0];

    if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Share link has expired' });
    }

    // Record external view
    const ip = req.ip || req.connection.remoteAddress;
    await db.query(
      `INSERT INTO external_views (share_token, ip_address, user_agent, referrer, platform, device_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.params.token, ip, req.headers['user-agent'], req.headers.referer, shareData.platform, req.headers['sec-ch-ua-mobile'] === '?1' ? 'mobile' : 'desktop']
    );

    // Fetch the actual content
    let content = null;
    if (shareData.content_type === 'video') {
      const video = await db.query(
        `SELECT vp.id, vp.title, vp.description, vp.video_url, vp.duration, vp.created_at,
                u.username, u.display_name, u.avatar_url
         FROM video_posts vp
         JOIN users u ON vp.user_id = u.id
         WHERE vp.id = $1 AND vp.is_public = TRUE AND vp.status = 'ready'`,
        [shareData.content_id]
      );
      content = video.rows[0] || null;
    } else if (shareData.content_type === 'room') {
      const room = await db.query(
        `SELECT r.id, r.title, r.description, r.is_active, r.enable_paywall, r.paywall_amount,
                u.username AS host_username, u.display_name AS host_display_name
         FROM multi_panel_rooms r
         JOIN users u ON r.host_user_id = u.id
         WHERE r.id = $1`,
        [shareData.content_id]
      );
      content = room.rows[0] || null;
    } else if (shareData.content_type === 'profile') {
      const user = await db.query(
        'SELECT id, username, display_name, avatar_url, bio, is_verified FROM users WHERE id = $1 AND is_active = TRUE',
        [shareData.content_id]
      );
      content = user.rows[0] || null;
    }

    res.json({ share: shareData, content });
  } catch (err) {
    next(err);
  }
});

// GET /api/shares/:token/analytics
router.get('/:token/analytics', authenticate, async (req, res, next) => {
  try {
    const share = await db.query(
      'SELECT * FROM share_links WHERE share_token = $1 AND created_by = $2',
      [req.params.token, req.user.id]
    );

    if (share.rows.length === 0) {
      return res.status(404).json({ error: 'Share link not found or unauthorized' });
    }

    const views = await db.query(
      `SELECT COUNT(*) AS total_views,
              COUNT(DISTINCT ip_address) AS unique_views,
              AVG(session_duration)::int AS avg_duration
       FROM external_views WHERE share_token = $1`,
      [req.params.token]
    );

    const platformBreakdown = await db.query(
      'SELECT platform, COUNT(*) AS count FROM external_views WHERE share_token = $1 GROUP BY platform',
      [req.params.token]
    );

    const deviceBreakdown = await db.query(
      'SELECT device_type, COUNT(*) AS count FROM external_views WHERE share_token = $1 GROUP BY device_type',
      [req.params.token]
    );

    res.json({
      share: share.rows[0],
      analytics: {
        ...views.rows[0],
        platforms: platformBreakdown.rows,
        devices: deviceBreakdown.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
