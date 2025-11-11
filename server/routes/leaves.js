const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
    createLeaveRequest,
    getMyLeaveRequests,
    getPendingLeaveRequests,
    getAllLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest
} = require('../controllers/leaveRequestsController');

// User routes
router.post('/', authenticateToken, createLeaveRequest);
router.get('/', authenticateToken, getMyLeaveRequests);

// Admin routes
router.get('/pending', authenticateToken, requireAdmin, getPendingLeaveRequests);
router.get('/all', authenticateToken, requireAdmin, getAllLeaveRequests);
router.put('/:id/approve', authenticateToken, requireAdmin, approveLeaveRequest);
router.put('/:id/reject', authenticateToken, requireAdmin, rejectLeaveRequest);

module.exports = router;
