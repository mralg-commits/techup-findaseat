const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rideRoutes = require('./routes/rides');
const userRoutes = require('./routes/users');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/rides', rideRoutes);
app.use('/api/users', userRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log('Server running on port 5000');
});
