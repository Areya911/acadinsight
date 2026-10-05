const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../acadinsight.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function translatePgToSqlite(sql) {
  if (!sql || typeof sql !== 'string') return sql;
  let out = sql;

  // Parameter substitution $1, $2 -> ?
  out = out.replace(/\$([0-9]+)/g, '?');

  // Strip Postgres typecasts like ::numeric, ::integer, ::text, ::real
  out = out.replace(/::[a-zA-Z0-9_]+/g, '');

  // NOW() - INTERVAL 'X months' -> datetime('now', '-X months')
  out = out.replace(/NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*months?'/gi, "datetime('now', '-$1 months')");
  out = out.replace(/NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*days?'/gi, "datetime('now', '-$1 days')");

  // DATE_TRUNC('month', col) -> strftime('%Y-%m', col)
  out = out.replace(/DATE_TRUNC\('month',\s*([a-zA-Z0-9_\.]+)\)/gi, "strftime('%Y-%m', $1)");

  // Types & defaults
  out = out.replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  out = out.replace(/DEFAULT\s+NOW\(\)/gi, 'DEFAULT CURRENT_TIMESTAMP');
  out = out.replace(/NOW\(\)/gi, "datetime('now')");
  out = out.replace(/ILIKE/gi, 'LIKE');
  out = out.replace(/JSONB/gi, 'TEXT');
  out = out.replace(/VARCHAR\(\d+\)/gi, 'TEXT');
  out = out.replace(/VARCHAR/gi, 'TEXT');
  out = out.replace(/NUMERIC\(\d+,\d+\)/gi, 'REAL');
  out = out.replace(/NUMERIC/gi, 'REAL');

  // Remove CASCADE in DROP TABLE
  out = out.replace(/DROP\s+TABLE\s+IF\s+EXISTS\s+([a-zA-Z0-9_]+)\s+CASCADE/gi, 'DROP TABLE IF EXISTS $1');
  out = out.replace(/DROP\s+TABLE\s+([a-zA-Z0-9_]+)\s+CASCADE/gi, 'DROP TABLE $1');

  return out;
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(row => {
    if (!row || typeof row !== 'object') return row;
    const newRow = { ...row };
    // Normalize aliases for common aggregate functions
    for (const key of Object.keys(row)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'count(*)' && !('count' in newRow)) {
        newRow.count = row[key];
      }
      if (lowerKey.startsWith('avg(') && !('avg' in newRow)) {
        newRow.avg = row[key];
      }
      if (lowerKey.startsWith('count(') && !('count' in newRow)) {
        newRow.count = row[key];
      }
    }
    return newRow;
  });
}

function executeQuery(sqlText, params = []) {
  const sql = translatePgToSqlite(sqlText);
  const trimmed = sql.trim();

  const boundParams = Array.isArray(params) ? params : [];

  // Transactions
  if (/^BEGIN/i.test(trimmed)) {
    try { db.exec('BEGIN TRANSACTION'); } catch(e) {}
    return Promise.resolve({ rows: [], rowCount: 0 });
  }
  if (/^COMMIT/i.test(trimmed)) {
    try { db.exec('COMMIT'); } catch(e) {}
    return Promise.resolve({ rows: [], rowCount: 0 });
  }
  if (/^ROLLBACK/i.test(trimmed)) {
    try { db.exec('ROLLBACK'); } catch(e) {}
    return Promise.resolve({ rows: [], rowCount: 0 });
  }

  // DDL Statements or CREATE INDEX / DROP
  if (/^(CREATE|ALTER|DROP)/i.test(trimmed)) {
    try {
      db.exec(sql);
      return Promise.resolve({ rows: [], rowCount: 0 });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  // DELETE / UPDATE without RETURNING
  if (/^(DELETE|UPDATE)/i.test(trimmed) && !/RETURNING/i.test(trimmed)) {
    try {
      const stmt = db.prepare(sql);
      const info = stmt.run(...boundParams);
      return Promise.resolve({ rows: [], rowCount: info.changes });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  // INSERT without RETURNING
  if (/^INSERT/i.test(trimmed) && !/RETURNING/i.test(trimmed)) {
    try {
      const stmt = db.prepare(sql);
      const info = stmt.run(...boundParams);
      return Promise.resolve({ rows: [{ id: info.lastInsertRowid }], rowCount: info.changes });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  // SELECT, or INSERT/UPDATE with RETURNING
  try {
    const stmt = db.prepare(sql);
    const rawRows = stmt.all(...boundParams);
    const rows = normalizeRows(rawRows || []);
    return Promise.resolve({ rows, rowCount: rows.length });
  } catch (err) {
    return Promise.reject(err);
  }
}

const sqlitePool = {
  query: (text, params) => {
    return executeQuery(text, params);
  },
  connect: async () => {
    return {
      query: (text, params) => executeQuery(text, params),
      release: () => {}
    };
  },
  on: () => {}
};

module.exports = sqlitePool;
