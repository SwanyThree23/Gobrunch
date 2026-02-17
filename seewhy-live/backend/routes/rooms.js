const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/rooms - List active rooms
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, parseInt(limit, 10));
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const result = await db.query(
      `SELECT r.id, r.title, r.description, r.max_participants, r.is_private,
              r.enable_paywall, r.paywall_amount, r.paywall_currency,
              r.enable_audio_only, r.started_at, r.created_at,
              u.id AS host_id, u.username AS host_username, u.display_name AS host_display_name,
              u.avatar_url AS host_avatar_url, u.is_verified AS host_verified,
              COALESCE(pc.participant_count, 0)::int AS participant_count
       FROM multi_panel_rooms r
       JOIN users u ON r.host_user_id = u.id
       LEFT JOIN (SELECT room_id, COUNT(*) AS participant_count FROM room_participants WHERE left_at IS NULL GROUP BY room_id) pc ON r.id = pc.room_id
       WHERE r.is_active = TRUE AND r.is_private = FALSE
       ORDER BY r.started_at DESC NULLS LAST, r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [safeLimit, offset]
    );

    res.json({ rooms: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.username AS host_username, u.display_name AS host_display_name,
              u.avatar_url AS host_avatar_url, u.is_verified AS host_verified
       FROM multi_panel_rooms r
       JOIN users u ON r.host_user_id = u.id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const participants = await db.query(
      `SELECT rp.*, u.username, u.display_name, u.avatar_url, u.is_verified
       FROM room_participants rp
       JOIN users u ON rp.user_id = u.id
       WHERE rp.room_id = $1 AND rp.left_at IS NULL
       ORDER BY rp.panel_position`,
      [req.params.id]
    );

    const room = result.rows[0];

    // Check paywall access if needed
    let hasPaywallAccess = false;
    if (room.enable_paywall && req.user) {
      const access = await db.query(
        'SELECT 1 FROM room_paywall_access WHERE room_id = $1 AND user_id = $2 AND expires_at > NOW()',
        [req.params.id, req.user.id]
      );
      hasPaywallAccess = access.rows.length > 0 || room.host_user_id === req.user.id;
    }

    res.json({
      room,
      participants: participants.rows,
      has_paywall_access: hasPaywallAccess,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms - Create room
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, description, max_participants = 16, is_private = false, enable_paywall = false, paywall_amount, enable_audio_only = false, recording_enabled = false } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const streamKey = uuidv4();
    const result = await db.query(
      `INSERT INTO multi_panel_rooms (host_user_id, title, description, max_participants, is_private, enable_paywall, paywall_amount, enable_audio_only, recording_enabled, stream_key, started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [req.user.id, title, description, max_participants, is_private, enable_paywall, enable_paywall ? paywall_amount : null, enable_audio_only, recording_enabled, streamKey]
    );

    const room = result.rows[0];

    // Add host as first participant
    await db.query(
      "INSERT INTO room_participants (room_id, user_id, panel_position, role) VALUES ($1, $2, 0, 'host')",
      [room.id, req.user.id]
    );

    res.status(201).json({ room });
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/:id/join
router.post('/:id/join', authenticate, async (req, res, next) => {
  try {
    const room = await db.query('SELECT * FROM multi_panel_rooms WHERE id = $1 AND is_active = TRUE', [req.params.id]);
    if (room.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }

    // Check paywall
    if (room.rows[0].enable_paywall && room.rows[0].host_user_id !== req.user.id) {
      const access = await db.query(
        'SELECT 1 FROM room_paywall_access WHERE room_id = $1 AND user_id = $2 AND expires_at > NOW()',
        [req.params.id, req.user.id]
      );
      if (access.rows.length === 0) {
        return res.status(402).json({ error: 'Payment required to access this room', paywall_amount: room.rows[0].paywall_amount });
      }
    }

    // Find next available panel position
    const positions = await db.query(
      'SELECT panel_position FROM room_participants WHERE room_id = $1 AND left_at IS NULL ORDER BY panel_position',
      [req.params.id]
    );
    const usedPositions = new Set(positions.rows.map((r) => r.panel_position));
    let nextPosition = 0;
    while (usedPositions.has(nextPosition)) nextPosition++;

    const result = await db.query(
      `INSERT INTO room_participants (room_id, user_id, panel_position, role)
       VALUES ($1, $2, $3, 'viewer')
       ON CONFLICT (room_id, user_id) DO UPDATE SET left_at = NULL, panel_position = $3, joined_at = NOW()
       RETURNING *`,
      [req.params.id, req.user.id, nextPosition]
    );

    res.json({ participant: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/:id/leave
router.post('/:id/leave', authenticate, async (req, res, next) => {
  try {
    await db.query(
      'UPDATE room_participants SET left_at = NOW() WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Left room' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/rooms/:id/end
router.put('/:id/end', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'UPDATE multi_panel_rooms SET is_active = FALSE, ended_at = NOW() WHERE id = $1 AND host_user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found or unauthorized' });
    }

    // Mark all participants as left
    await db.query(
      'UPDATE room_participants SET left_at = NOW() WHERE room_id = $1 AND left_at IS NULL',
      [req.params.id]
    );

    res.json({ room: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/rooms/:id/invite
router.post('/:id/invite', authenticate, async (req, res, next) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const room = await db.query('SELECT * FROM multi_panel_rooms WHERE id = $1 AND host_user_id = $2', [req.params.id, req.user.id]);
    if (room.rows.length === 0) {
      return res.status(403).json({ error: 'Only the host can send invites' });
    }

    const inviteToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await db.query(
      `INSERT INTO room_invites (room_id, user_id, invited_by, invite_token, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (room_id, user_id) DO UPDATE SET invite_token = $4, status = 'pending', expires_at = $5
       RETURNING *`,
      [req.params.id, user_id, req.user.id, inviteToken, expiresAt]
    );

    res.status(201).json({ invite: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/rooms/:id/participants/:userId/role
router.put('/:id/participants/:userId/role', authenticate, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['co-host', 'speaker', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const room = await db.query('SELECT * FROM multi_panel_rooms WHERE id = $1 AND host_user_id = $2', [req.params.id, req.user.id]);
    if (room.rows.length === 0) {
      return res.status(403).json({ error: 'Only the host can change roles' });
    }

    const result = await db.query(
      'UPDATE room_participants SET role = $1 WHERE room_id = $2 AND user_id = $3 AND left_at IS NULL RETURNING *',
      [role, req.params.id, req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({ participant: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
