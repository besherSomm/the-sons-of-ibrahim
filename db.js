const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'data', 'apps.db');

// ensure directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database open error:', err);
  } else {
    console.log('Database connected');
    initializeTables();
  }
});

function initializeTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      appName TEXT,
      description TEXT,
      filename TEXT,
      originalName TEXT,
      mimetype TEXT,
      size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT,
      email TEXT,
      bookTitle TEXT,
      description TEXT,
      filename TEXT,
      originalName TEXT,
      mimetype TEXT,
      size INTEGER,
      bookLink TEXT,
      isExternal INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

module.exports = db;
