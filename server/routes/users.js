const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
  'INSERT INTO users (name, email, password_hash, phone) VALUES ($1, $2, $3, $4) RETURNING id',
  [name, email, hash, phone]
);
  res.json({ userId: result.rows[0].id });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (user && await bcrypt.compare(password, user.password_hash)) {
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.json({ token, userId: user.id }); 
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.get('/:id/confirmed', async (req, res) => {
  const userId = req.params.id;
  const query = `
    SELECT r.*, u.name, u.phone FROM rides r
    JOIN ride_participants rp ON rp.ride_id = r.id
    JOIN users u ON u.id = r.user_id
    WHERE rp.user_id = $1
    UNION
    SELECT r.*, u.name, u.phone FROM rides r
    JOIN ride_participants rp ON rp.ride_id = r.id
    JOIN users u ON u.id = rp.user_id
    WHERE r.user_id = $1
  `;
  const { rows } = await pool.query(query, [userId]);
  res.json(rows);
});

module.exports = router;
