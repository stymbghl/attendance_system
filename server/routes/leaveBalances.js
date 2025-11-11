const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
    getMyLeaveBalances,
    getUserLeaveBalances
} = require('../controllers/leaveBalancesController');

// Get my leave balances
router.get('/', authenticateToken, getMyLeaveBalances);

// Get specific user's leave balances (admin only)
router.get('/user/:userId', authenticateToken, requireAdmin, getUserLeaveBalances);

module.exports = router;
