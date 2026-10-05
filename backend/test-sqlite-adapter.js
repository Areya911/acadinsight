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

const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
const info = stmt.run('Admin', 'admin@test.com', 'pass', 'admin');
console.log('Inserted:', info);

const select = db.prepare('SELECT * FROM users WHERE email = ?');
console.log('Rows:', select.all('admin@test.com'));
