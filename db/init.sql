-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    isAdmin INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    date TEXT NOT NULL,
    hasConsent INTEGER NOT NULL,
    type TEXT DEFAULT 'attendance' CHECK(type IN ('attendance', 'leave')),
    leaveRequestId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (leaveRequestId) REFERENCES leave_requests(id),
    UNIQUE(userId, date)
);

-- Leave types table
CREATE TABLE IF NOT EXISTS leave_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    defaultDays INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leave balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    leaveTypeId INTEGER NOT NULL,
    totalDays INTEGER NOT NULL,
    usedDays INTEGER DEFAULT 0,
    remainingDays INTEGER NOT NULL,
    year INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (leaveTypeId) REFERENCES leave_types(id),
    UNIQUE(userId, leaveTypeId, year)
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    leaveTypeId INTEGER NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    approvedBy INTEGER,
    approvedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (leaveTypeId) REFERENCES leave_types(id),
    FOREIGN KEY (approvedBy) REFERENCES users(id)
);

-- Seed default leave types
INSERT OR IGNORE INTO leave_types (name, defaultDays) VALUES
    ('Sick Leave', 10),
    ('Vacation', 15),
    ('Personal Leave', 5);
