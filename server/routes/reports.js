const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Attendance reports
router.get('/my-attendance', authenticateToken, reportsController.getMyReport);
router.get('/all-users', authenticateToken, requireAdmin, reportsController.getAllUsersReport);

// Leave reports
router.get('/my-leaves', authenticateToken, reportsController.getMyLeaveReport);
router.get('/all-leaves', authenticateToken, requireAdmin, reportsController.getAllLeavesReport);
router.get('/leave-stats', authenticateToken, requireAdmin, reportsController.getLeaveStatistics);

module.exports = router;
