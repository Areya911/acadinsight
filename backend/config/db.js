const { Pool } = require('pg');
require('dotenv').config();
const sqlitePool = require('./sqliteAdapter');

let pool;

const shouldUseRemote = process.env.USE_REMOTE_POSTGRES === 'true' || 
  Boolean(process.env.DATABASE_URL && process.env.RENDER);

if (shouldUseRemote && process.env.DATABASE_URL) {
  try {
    const isLocalhost = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocalhost ? false : { rejectUnauthorized: false }
    });
    console.log('Connected to Remote PostgreSQL Database');
  } catch (err) {
    console.warn('Remote PostgreSQL pool creation failed, falling back to local SQLite adapter:', err.message);
    pool = sqlitePool;
  }
} else {
  // Use local SQLite database adapter
  pool = sqlitePool;
}

module.exports = pool;
