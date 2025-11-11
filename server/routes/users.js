const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getAllUsers } = require('../controllers/usersController');

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, getAllUsers);

module.exports = router;
