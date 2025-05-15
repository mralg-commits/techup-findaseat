const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const { pickup_point, destination, date } = req.query;
  const result = await pool.query(
    'SELECT * FROM rides WHERE pickup_point = $1 AND destination = $2 AND date = $3',
    [pickup_point, destination, date]
  );
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { user_id, pickup_point, exact_address, destination, date, time, seats_available } = req.body;
  const result = await pool.query(
    'INSERT INTO rides (user_id, pickup_point, exact_address, destination, date, time, seats_available) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [user_id, pickup_point, exact_address, destination, date, time, seats_available]
  );
  res.json(result.rows[0]);
});

// POST /api/rides/:id/join
router.post('/rides/:id/join', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const rideId = req.params.id;

  try {
    // Check if already joined
    const existing = await pool.query(
      'SELECT * FROM ride_participants WHERE ride_id = $1 AND user_id = $2',
      [rideId, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already joined' });
    }

    // Check available seats
    const rideResult = await pool.query('SELECT seats_available FROM rides WHERE id = $1', [rideId]);
    const ride = rideResult.rows[0];
    if (!ride || ride.seats_available <= 0) {
      return res.status(400).json({ error: 'No seats available' });
    }

    // Insert participant and decrement seat count
    await pool.query('BEGIN');
    await pool.query(
      'INSERT INTO ride_participants (ride_id, user_id) VALUES ($1, $2)',
      [rideId, userId]
    );
    await pool.query(
      'UPDATE rides SET seats_available = seats_available - 1 WHERE id = $1',
      [rideId]
    );
    await pool.query('COMMIT');

    res.json({ message: 'Successfully joined ride' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Database error' });
  }
});


router.delete('/:id', async (req, res) => {
  const rideId = req.params.id;

  const { rows } = await pool.query('SELECT COUNT(*) FROM ride_participants WHERE ride_id = $1', [rideId]);
  if (+rows[0].count > 0) return res.status(400).json({ error: 'Users already joined' });

  await pool.query('DELETE FROM rides WHERE id = $1', [rideId]);
  res.sendStatus(200);
});

// DELETE /api/rides/:id/cancel
router.delete('/rides/:id/cancel', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const rideId = req.params.id;

  try {
    await pool.query('BEGIN');
    await pool.query(
      'DELETE FROM ride_participants WHERE ride_id = $1 AND user_id = $2',
      [rideId, userId]
    );
    await pool.query(
      'UPDATE rides SET seats_available = seats_available + 1 WHERE id = $1',
      [rideId]
    );
    await pool.query('COMMIT');

    res.json({ message: 'Canceled participation' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/rides/created
router.get('/rides/created', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  const rides = await pool.query(
    `SELECT r.*, json_agg(json_build_object('name', u.name, 'mobile', u.mobile_number)) AS participants
     FROM rides r
     LEFT JOIN ride_participants rp ON r.id = rp.ride_id
     LEFT JOIN users u ON rp.user_id = u.id
     WHERE r.created_by = $1
     GROUP BY r.id`,
    [userId]
  );

  res.json(rides.rows);
});



module.exports = router;
