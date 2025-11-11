const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, attendanceController.markAttendance);
router.get('/', authenticateToken, attendanceController.getMyAttendance);
router.get('/records', authenticateToken, attendanceController.getAttendanceRecords);

module.exports = router;
