const db = require('../config/db');

/**
 * Get all users (admin only)
 */
const getAllUsers = (req, res) => {
    const query = 'SELECT id, name, email, isAdmin, createdAt FROM users ORDER BY createdAt DESC';

    db.all(query, [], (error, users) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching users' });
        }
        res.json(users);
    });
};

module.exports = {
    getAllUsers
};
