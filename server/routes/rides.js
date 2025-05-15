const express = require('express');
const pool = require('../db');
const router = express.Router();
const authenticateToken = require('../authenticateToken');

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
router.post('/:id/join', authenticateToken, async (req, res) => {
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

// GET /api/rides/joined
router.get('/joined', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(`
      SELECT r.id, r.pickup_point, r.exact_address, r.destination, r.date, r.time, r.seats_available, u.name AS host_name, u.phone AS host_contact
      FROM rides r
      JOIN ride_participants rp ON r.id = rp.ride_id
      JOIN users u ON r.user_id = u.id
      WHERE rp.user_id = $1
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch joined rides' });
  }
});


// DELETE /api/rides/:id/cancel
router.delete('/:id/cancel', authenticateToken, async (req, res) => {
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
router.get('/created', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const rides = await pool.query(
      `SELECT 
         r.id AS ride_id,
         r.pickup_point,
         r.exact_address,
         r.destination,
         r.date,
         r.time,
         r.seats_available,
         COALESCE(json_agg(
           json_build_object('user_id',u.id, 'name', u.name, 'phone', u.phone)
         ) FILTER (WHERE u.id IS NOT NULL), '[]') AS participants
       FROM rides r
       LEFT JOIN ride_participants rp ON r.id = rp.ride_id
       LEFT JOIN users u ON rp.user_id = u.id
       WHERE r.user_id = $1
       GROUP BY r.id`,
      [userId]
    );

    res.json(rides.rows);
  } catch (err) {
    console.error('Error fetching created rides:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/rides/:rideId/participants/:userId
router.delete('/:rideId/participants/:userId', authenticateToken, async (req, res) => {
  const { rideId, userId } = req.params;

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
    res.json({ message: 'Participant removed successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// DELETE /api/rides/:rideId
router.delete('/:rideId', authenticateToken, async (req, res) => {
  const rideId = req.params.rideId;
  const userId = req.user.userId;

  try {
    // Check if user owns the ride
    const ride = await pool.query('SELECT * FROM rides WHERE id = $1 AND user_id = $2', [rideId, userId]);
    if (ride.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this ride.' });
    }

    // Check if there are participants
    const participants = await pool.query('SELECT COUNT(*) FROM ride_participants WHERE ride_id = $1', [rideId]);
    if (parseInt(participants.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot cancel ride with joined participants.' });
    }

    // Delete the ride
    await pool.query('DELETE FROM rides WHERE id = $1', [rideId]);
    res.json({ message: 'Ride deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
