const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/payments/methods - Get user's payment methods
router.get('/methods', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, provider, is_active, verified_at, created_at FROM user_payment_methods WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ methods: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/methods - Add payment method
router.post('/methods', authenticate, async (req, res, next) => {
  try {
    const { provider, credentials } = req.body;

    if (!provider || !credentials) {
      return res.status(400).json({ error: 'Provider and credentials are required' });
    }

    const validProviders = ['paypal', 'cashapp', 'venmo', 'zelle', 'chime'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Invalid payment provider' });
    }

    // In production, use proper encryption (AES-256-GCM)
    // This is a placeholder for the encryption step
    const encryptedCredentials = Buffer.from(JSON.stringify(credentials)).toString('base64');
    const iv = uuidv4().replace(/-/g, '').substring(0, 32);
    const tag = uuidv4().replace(/-/g, '').substring(0, 32);

    const result = await db.query(
      `INSERT INTO user_payment_methods (user_id, provider, encrypted_credentials, encryption_iv, encryption_tag)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, provider) DO UPDATE SET encrypted_credentials = $3, encryption_iv = $4, encryption_tag = $5, is_active = TRUE
       RETURNING id, provider, is_active, created_at`,
      [req.user.id, provider, encryptedCredentials, iv, tag]
    );

    res.status(201).json({ method: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/payments/methods/:id
router.delete('/methods/:id', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'UPDATE user_payment_methods SET is_active = FALSE WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json({ message: 'Payment method removed' });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/send - Send payment to a user
router.post('/send', authenticate, async (req, res, next) => {
  try {
    const { to_user_id, amount, provider } = req.body;

    if (!to_user_id || !amount || !provider) {
      return res.status(400).json({ error: 'to_user_id, amount, and provider are required' });
    }

    if (to_user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot send payment to yourself' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Verify recipient exists
    const recipient = await db.query('SELECT id, username FROM users WHERE id = $1 AND is_active = TRUE', [to_user_id]);
    if (recipient.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Verify sender has payment method
    const senderMethod = await db.query(
      'SELECT id FROM user_payment_methods WHERE user_id = $1 AND provider = $2 AND is_active = TRUE',
      [req.user.id, provider]
    );
    if (senderMethod.rows.length === 0) {
      return res.status(400).json({ error: 'You do not have this payment method set up' });
    }

    const idempotencyKey = req.headers['idempotency-key'] || uuidv4();

    const result = await db.query(
      `INSERT INTO payment_transactions (idempotency_key, from_user_id, to_user_id, amount, provider, status)
       VALUES ($1, $2, $3, $4, $5, 'completed')
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [idempotencyKey, req.user.id, to_user_id, amount, provider]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Duplicate transaction' });
    }

    res.status(201).json({ transaction: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/room-access - Pay for room paywall
router.post('/room-access', authenticate, async (req, res, next) => {
  try {
    const { room_id, provider } = req.body;

    if (!room_id || !provider) {
      return res.status(400).json({ error: 'room_id and provider are required' });
    }

    const room = await db.query(
      'SELECT * FROM multi_panel_rooms WHERE id = $1 AND is_active = TRUE AND enable_paywall = TRUE',
      [room_id]
    );
    if (room.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found or paywall not enabled' });
    }

    const roomData = room.rows[0];

    // Create payment transaction
    const transaction = await db.query(
      `INSERT INTO payment_transactions (from_user_id, to_user_id, amount, provider, status)
       VALUES ($1, $2, $3, $4, 'completed')
       RETURNING *`,
      [req.user.id, roomData.host_user_id, roomData.paywall_amount, provider]
    );

    // Grant access for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const access = await db.query(
      `INSERT INTO room_paywall_access (room_id, user_id, transaction_id, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (room_id, user_id) DO UPDATE SET transaction_id = $3, expires_at = $4
       RETURNING *`,
      [room_id, req.user.id, transaction.rows[0].id, expiresAt]
    );

    res.status(201).json({ access: access.rows[0], transaction: transaction.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClause = '(pt.from_user_id = $1 OR pt.to_user_id = $1)';
    if (type === 'sent') whereClause = 'pt.from_user_id = $1';
    if (type === 'received') whereClause = 'pt.to_user_id = $1';

    const result = await db.query(
      `SELECT pt.*,
              sender.username AS from_username, sender.display_name AS from_display_name,
              receiver.username AS to_username, receiver.display_name AS to_display_name
       FROM payment_transactions pt
       JOIN users sender ON pt.from_user_id = sender.id
       JOIN users receiver ON pt.to_user_id = receiver.id
       WHERE ${whereClause}
       ORDER BY pt.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit, 10), offset]
    );

    res.json({ transactions: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/earnings
router.get('/earnings', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM user_earnings WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ earnings: { total_received: 0, payment_count: 0, paywall_sales: 0, paywall_revenue: 0, total_earnings: 0 } });
    }

    res.json({ earnings: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
