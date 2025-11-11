const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
    getAllLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType
} = require('../controllers/leaveTypesController');

// Get all leave types (accessible to all authenticated users)
router.get('/', authenticateToken, getAllLeaveTypes);

// Create, update, and delete operations require admin privileges
router.post('/', authenticateToken, requireAdmin, createLeaveType);
router.put('/:id', authenticateToken, requireAdmin, updateLeaveType);
router.delete('/:id', authenticateToken, requireAdmin, deleteLeaveType);

module.exports = router;
