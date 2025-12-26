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
 * Also connects to SNFalyze database (snf_platform) for:
 * - Historical facility_snapshots (trends data from 2020-present)
 * - Quality measures, citations history, etc.
 *
 * Both databases are read-only from SystemsCheck's perspective.
 */

const { Pool } = require('pg');

let marketPool = null;
let snfalyzePool = null;

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
 * Get SNFalyze Database Pool
 *
 * Returns a PostgreSQL connection pool for the SNFalyze historical database.
 * Uses SNFALYZE_DATABASE_URL environment variable.
 * Contains facility_snapshots with historical trends data.
 */
const getSNFalyzePool = () => {
  if (!snfalyzePool) {
    const connectionString = process.env.SNFALYZE_DATABASE_URL;

    if (!connectionString) {
      console.warn('[SNFalyze Database] SNFALYZE_DATABASE_URL not set - historical trends will be unavailable');
      return null;
    }

    const isProduction = connectionString.includes('render.com');

    console.log('[SNFalyze Database] Connecting to SNFalyze database...');

    snfalyzePool = new Pool({
      connectionString,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    // Test connection
    snfalyzePool.query('SELECT 1')
      .then(() => console.log('[SNFalyze Database] Connection successful'))
      .catch(err => console.error('[SNFalyze Database] Connection failed:', err.message));
  }
  return snfalyzePool;
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
  if (snfalyzePool) {
    await snfalyzePool.end();
    snfalyzePool = null;
    console.log('[SNFalyze Database] Connection pool closed');
  }
};

module.exports = {
  getMarketPool,
  getSNFalyzePool,
  closeMarketPool
};
