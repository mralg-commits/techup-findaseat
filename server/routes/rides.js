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
  const { user_id, pickup_point, destination, date, time } = req.body;
  const result = await pool.query(
    'INSERT INTO rides (user_id, pickup_point, destination, date, time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [user_id, pickup_point, destination, date, time]
  );
  res.json(result.rows[0]);
});

module.exports = router;
