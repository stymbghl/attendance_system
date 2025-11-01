const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/my-attendance', authenticateToken, reportsController.getMyReport);
router.get('/all-users', authenticateToken, requireAdmin, reportsController.getAllUsersReport);

module.exports = router;
