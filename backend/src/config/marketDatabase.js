/**
 * Market Database Configuration
 *
 * Connects to the shared CMS/market database (snf_market_data) for:
 * - SNF facility data (snf_facilities table)
 * - Health citations and deficiencies
 * - VBP performance scores
 * - Ownership records
 * - Survey data
 *
 * This database is read-only from SystemsCheck's perspective.
 */

const { Pool } = require('pg');

let marketPool = null;

/**
 * Get Market Database Pool
 *
 * Returns a PostgreSQL connection pool for the market database.
 * Uses MARKET_DATABASE_URL environment variable.
 */
const getMarketPool = () => {
  if (!marketPool) {
    const connectionString = process.env.MARKET_DATABASE_URL;

    if (!connectionString) {
      console.warn('[Market Database] MARKET_DATABASE_URL not set - CMS features will be unavailable');
      return null;
    }

    const isProduction = connectionString.includes('render.com');

    console.log('[Market Database] Connecting to market database...');

    marketPool = new Pool({
      connectionString,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    // Test connection
    marketPool.query('SELECT 1')
      .then(() => console.log('[Market Database] Connection successful'))
      .catch(err => console.error('[Market Database] Connection failed:', err.message));
  }
  return marketPool;
};

/**
 * Close Market Database Pool
 *
 * Call this during graceful shutdown.
 */
const closeMarketPool = async () => {
  if (marketPool) {
    await marketPool.end();
    marketPool = null;
    console.log('[Market Database] Connection pool closed');
  }
};

module.exports = {
  getMarketPool,
  closeMarketPool
};
