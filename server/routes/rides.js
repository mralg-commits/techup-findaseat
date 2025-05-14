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

router.post('/:id/join', async (req, res) => {
  const rideId = req.params.id;
  const userId = req.body.user_id;

  const { rows } = await pool.query('SELECT seats_available FROM rides WHERE id = $1', [rideId]);
  if (rows[0].seats_available <= 0) return res.status(400).json({ error: 'No seats left' });

  await pool.query('INSERT INTO ride_participants (ride_id, user_id) VALUES ($1, $2)', [rideId, userId]);
  await pool.query('UPDATE rides SET seats_available = seats_available - 1 WHERE id = $1', [rideId]);

  res.sendStatus(200);
});

router.delete('/:id', async (req, res) => {
  const rideId = req.params.id;

  const { rows } = await pool.query('SELECT COUNT(*) FROM ride_participants WHERE ride_id = $1', [rideId]);
  if (+rows[0].count > 0) return res.status(400).json({ error: 'Users already joined' });

  await pool.query('DELETE FROM rides WHERE id = $1', [rideId]);
  res.sendStatus(200);
});

router.post('/:id/leave', async (req, res) => {
  const rideId = req.params.id;
  const userId = req.body.user_id;

  await pool.query('DELETE FROM ride_participants WHERE ride_id = $1 AND user_id = $2', [rideId, userId]);
  await pool.query('UPDATE rides SET seats_available = seats_available + 1 WHERE id = $1', [rideId]);

  res.sendStatus(200);
});



module.exports = router;
