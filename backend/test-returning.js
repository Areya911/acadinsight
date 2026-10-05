const Database = require('better-sqlite3');
const db = new Database(':memory:');

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Test INSERT RETURNING in SQLite
const stmt1 = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) RETURNING id, name, email, role');
const res1 = stmt1.all('Alice', 'alice@student.com', 'pass', 'student');
console.log('INSERT RETURNING result:', res1);

// Test ON CONFLICT DO UPDATE RETURNING in SQLite
const stmt2 = db.prepare(`
  INSERT INTO users (name, email, password, role)
  VALUES (?, ?, ?, ?)
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id, name, email
`);
const res2 = stmt2.all('Alice Updated', 'alice@student.com', 'pass', 'student');
console.log('ON CONFLICT RETURNING result:', res2);
