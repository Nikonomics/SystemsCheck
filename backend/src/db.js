/**
 * Local Database Pool
 *
 * Provides direct PostgreSQL pool access for raw SQL queries
 * when Sequelize abstraction isn't needed.
 */

const { Pool } = require('pg');
require('dotenv').config();

let pool;

// Create pool based on environment
if (process.env.DATABASE_URL) {
  // Production: Use connection string
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });
} else {
  // Development: Use individual params
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'systemscheck',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });
}

// Log connection on first use
pool.on('connect', () => {
  console.log('Local database pool connected');
});

pool.on('error', (err) => {
  console.error('Unexpected error on local database pool:', err);
});

module.exports = pool;
