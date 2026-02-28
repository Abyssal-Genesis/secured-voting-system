/**
 * Database Configuration
 * PostgreSQL connection setup with connection pooling
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voting_system_test',
  user: process.env.DB_USER || 'voting_user',
  password: process.env.DB_PASSWORD || 'test_db_password_secure',
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection pool event handlers
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('[DB] PostgreSQL connection established');
});

pool.on('remove', () => {
  console.log('[DB] PostgreSQL connection removed from pool');
});

/**
 * Query wrapper for logging and error handling
 */
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB] Query executed in ${duration}ms: ${text.substring(0, 50)}...`);
    return result;
  } catch (error) {
    console.error('[DB] Query error:', error);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = async () => {
  return pool.connect();
};

module.exports = {
  pool,
  query,
  getClient
};
