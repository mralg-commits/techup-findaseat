const { Pool } = require('pg');

// Ensure to set up SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,  // This allows the connection to proceed without verifying the server's certificate (useful for cloud services like Render)
  },
});

module.exports = pool;
