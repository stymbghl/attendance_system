const db = require('../config/db');

/**
 * Get all leave types
 */
const getAllLeaveTypes = (req, res) => {
    const query = 'SELECT * FROM leave_types ORDER BY name';

    db.all(query, [], (error, leaveTypes) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching leave types' });
        }
        res.json(leaveTypes);
    });
};

/**
 * Create a new leave type
 * When created, automatically initialize balances for all existing users
 */
const createLeaveType = async (req, res) => {
    const { name, defaultDays } = req.body;

    // Validate input
    const hasValidName = name && name.trim().length > 0;
    const hasValidDays = defaultDays && Number.isInteger(defaultDays) && defaultDays > 0;

    if (!hasValidName) {
        return res.status(400).json({ message: 'Leave type name is required' });
    }

    if (!hasValidDays) {
        return res.status(400).json({ message: 'Default days must be a positive integer' });
    }

    const insertQuery = 'INSERT INTO leave_types (name, defaultDays) VALUES (?, ?)';

    db.run(insertQuery, [name.trim(), defaultDays], function(error) {
        if (error) {
            const isDuplicateName = error.message.includes('UNIQUE');
            if (isDuplicateName) {
                return res.status(400).json({ message: 'Leave type with this name already exists' });
            }
            return res.status(500).json({ message: 'Error creating leave type' });
        }

        const newLeaveTypeId = this.lastID;
        const currentYear = new Date().getFullYear();

        // Initialize balances for all users
        const getUsersQuery = 'SELECT id FROM users';
        db.all(getUsersQuery, [], (getUsersError, users) => {
            if (getUsersError) {
                return res.status(500).json({ message: 'Error initializing balances' });
            }

            const balanceInsertQuery = `
                INSERT INTO leave_balances (userId, leaveTypeId, totalDays, usedDays, remainingDays, year)
                VALUES (?, ?, ?, 0, ?, ?)
            `;

            // Insert balance for each user
            const insertPromises = users.map(user => {
                return new Promise((resolve, reject) => {
                    db.run(
                        balanceInsertQuery,
                        [user.id, newLeaveTypeId, defaultDays, defaultDays, currentYear],
                        (balanceError) => {
                            if (balanceError) reject(balanceError);
                            else resolve();
                        }
                    );
                });
            });

            Promise.all(insertPromises)
                .then(() => {
                    res.status(201).json({
                        message: 'Leave type created successfully',
                        leaveType: {
                            id: newLeaveTypeId,
                            name: name.trim(),
                            defaultDays
                        }
                    });
                })
                .catch(() => {
                    res.status(500).json({ message: 'Error initializing balances for users' });
                });
        });
    });
};

/**
 * Update a leave type
 */
const updateLeaveType = (req, res) => {
    const { id } = req.params;
    const { name, defaultDays } = req.body;

    // Validate input
    const hasValidName = name && name.trim().length > 0;
    const hasValidDays = defaultDays && Number.isInteger(defaultDays) && defaultDays > 0;

    if (!hasValidName) {
        return res.status(400).json({ message: 'Leave type name is required' });
    }

    if (!hasValidDays) {
        return res.status(400).json({ message: 'Default days must be a positive integer' });
    }

    const updateQuery = 'UPDATE leave_types SET name = ?, defaultDays = ? WHERE id = ?';

    db.run(updateQuery, [name.trim(), defaultDays, id], function(error) {
        if (error) {
            const isDuplicateName = error.message.includes('UNIQUE');
            if (isDuplicateName) {
                return res.status(400).json({ message: 'Leave type with this name already exists' });
            }
            return res.status(500).json({ message: 'Error updating leave type' });
        }

        const wasUpdated = this.changes > 0;
        if (!wasUpdated) {
            return res.status(404).json({ message: 'Leave type not found' });
        }

        res.json({ message: 'Leave type updated successfully' });
    });
};

/**
 * Delete a leave type
 */
const deleteLeaveType = (req, res) => {
    const { id } = req.params;

    // Check if leave type has any associated requests
    const checkQuery = 'SELECT COUNT(*) as count FROM leave_requests WHERE leaveTypeId = ?';

    db.get(checkQuery, [id], (checkError, result) => {
        if (checkError) {
            return res.status(500).json({ message: 'Error checking leave type usage' });
        }

        const hasAssociatedRequests = result.count > 0;
        if (hasAssociatedRequests) {
            return res.status(400).json({
                message: 'Cannot delete leave type with existing leave requests'
            });
        }

        // Delete associated balances first
        const deleteBalancesQuery = 'DELETE FROM leave_balances WHERE leaveTypeId = ?';
        db.run(deleteBalancesQuery, [id], (balanceError) => {
            if (balanceError) {
                return res.status(500).json({ message: 'Error deleting leave balances' });
            }

            // Delete the leave type
            const deleteQuery = 'DELETE FROM leave_types WHERE id = ?';
            db.run(deleteQuery, [id], function(error) {
                if (error) {
                    return res.status(500).json({ message: 'Error deleting leave type' });
                }

                const wasDeleted = this.changes > 0;
                if (!wasDeleted) {
                    return res.status(404).json({ message: 'Leave type not found' });
                }

                res.json({ message: 'Leave type deleted successfully' });
            });
        });
    });
};

module.exports = {
    getAllLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType
};
