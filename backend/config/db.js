const { Pool } = require('pg');
require('dotenv').config();
const sqlitePool = require('./sqliteAdapter');

let pool;

if (process.env.USE_REMOTE_POSTGRES === 'true' && process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false
    });
  } catch (err) {
    console.warn('⚠️  Remote PostgreSQL pool creation failed, using local SQLite database.');
    pool = sqlitePool;
  }
} else {
  // Use local SQLite database adapter
  pool = sqlitePool;
}

module.exports = pool;
