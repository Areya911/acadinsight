const { Pool } = require('pg');
require('dotenv').config();
const sqlitePool = require('./sqliteAdapter');

let pool;
let usingPostgres = false;

const shouldTryRemote = process.env.USE_REMOTE_POSTGRES === 'true' ||
  Boolean(process.env.DATABASE_URL && (process.env.RENDER || process.env.NODE_ENV === 'production'));

if (shouldTryRemote && process.env.DATABASE_URL) {
  const isLocalhost = process.env.DATABASE_URL.includes('localhost') ||
    process.env.DATABASE_URL.includes('127.0.0.1');
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
  });

  // Create a proxy pool that falls back to SQLite if Postgres is unreachable
  pool = {
    _pg: pgPool,
    _sqlite: sqlitePool,
    _pgReady: null, // will be resolved after first connection test

    query: async function(text, params) {
      // If we already know Postgres works, use it
      if (usingPostgres) {
        return this._pg.query(text, params);
      }
      // If we already know Postgres failed, use SQLite
      if (this._pgReady === false) {
        return this._sqlite.query(text, params);
      }
      // First call: test Postgres
      try {
        const result = await this._pg.query(text, params);
        usingPostgres = true;
        this._pgReady = true;
        return result;
      } catch (err) {
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' ||
            err.code === 'ETIMEDOUT' || err.message.includes('ENOTFOUND') ||
            err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
          console.warn('PostgreSQL unreachable, falling back to local SQLite:', err.message);
          this._pgReady = false;
          return this._sqlite.query(text, params);
        }
        throw err;
      }
    },

    connect: async function() {
      if (usingPostgres) return this._pg.connect();
      if (this._pgReady === false) return this._sqlite.connect();
      // Test connection first
      try {
        await this._pg.query('SELECT 1');
        usingPostgres = true;
        this._pgReady = true;
        return this._pg.connect();
      } catch (err) {
        console.warn('PostgreSQL connect failed, using SQLite:', err.message);
        this._pgReady = false;
        return this._sqlite.connect();
      }
    },

    on: function(...args) {
      this._pg.on(...args);
    }
  };

  // Test the connection immediately in background
  pgPool.query('SELECT 1')
    .then(() => {
      usingPostgres = true;
      pool._pgReady = true;
      console.log('Connected to Remote PostgreSQL Database');
    })
    .catch((err) => {
      pool._pgReady = false;
      console.warn('PostgreSQL not reachable, using SQLite fallback:', err.message);
    });

} else {
  pool = sqlitePool;
  console.log('Using local SQLite database');
}

module.exports = pool;
