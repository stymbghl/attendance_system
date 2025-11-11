require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database (this also runs schema initialization)
require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const reportsRoutes = require('./routes/reports');
const leaveTypesRoutes = require('./routes/leaveTypes');
const leaveBalancesRoutes = require('./routes/leaveBalances');
const leavesRoutes = require('./routes/leaves');
const usersRoutes = require('./routes/users');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve landing.html for root path (must be before static middleware)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/landing.html'));
});

// Static files middleware
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/leave-types', leaveTypesRoutes);
app.use('/api/leave-balances', leaveBalancesRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/users', usersRoutes);

// Global error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
