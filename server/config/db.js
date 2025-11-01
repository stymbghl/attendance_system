const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || './db/attendance.db';
const dbDirectory = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        console.error('Database connection error:', error.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// Initialize database schema
const initializationScript = fs.readFileSync(
    path.join(__dirname, '../../db/init.sql'),
    'utf8'
);

db.exec(initializationScript, (error) => {
    if (error) {
        console.error('Database initialization error:', error.message);
        process.exit(1);
    }
    console.log('Database schema initialized');
});

module.exports = db;
