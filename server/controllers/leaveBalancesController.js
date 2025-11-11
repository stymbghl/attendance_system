const db = require('../config/db');

/**
 * Get leave balances for the authenticated user
 */
const getMyLeaveBalances = (req, res) => {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    const query = `
        SELECT
            lb.id,
            lb.totalDays,
            lb.usedDays,
            lb.remainingDays,
            lb.year,
            lt.id as leaveTypeId,
            lt.name as leaveTypeName
        FROM leave_balances lb
        JOIN leave_types lt ON lb.leaveTypeId = lt.id
        WHERE lb.userId = ? AND lb.year = ?
        ORDER BY lt.name
    `;

    db.all(query, [userId, currentYear], (error, balances) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching leave balances' });
        }
        res.json(balances);
    });
};

/**
 * Get leave balances for a specific user (admin only)
 */
const getUserLeaveBalances = (req, res) => {
    const { userId } = req.params;
    const year = req.query.year || new Date().getFullYear();

    const query = `
        SELECT
            lb.id,
            lb.totalDays,
            lb.usedDays,
            lb.remainingDays,
            lb.year,
            lt.id as leaveTypeId,
            lt.name as leaveTypeName,
            u.name as userName,
            u.email as userEmail
        FROM leave_balances lb
        JOIN leave_types lt ON lb.leaveTypeId = lt.id
        JOIN users u ON lb.userId = u.id
        WHERE lb.userId = ? AND lb.year = ?
        ORDER BY lt.name
    `;

    db.all(query, [userId, year], (error, balances) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching leave balances' });
        }
        res.json(balances);
    });
};

/**
 * Initialize leave balances for a user (called when new user registers)
 */
const initializeUserBalances = (userId) => {
    return new Promise((resolve, reject) => {
        const currentYear = new Date().getFullYear();

        // Get all leave types
        const getLeaveTypesQuery = 'SELECT id, defaultDays FROM leave_types';

        db.all(getLeaveTypesQuery, [], (error, leaveTypes) => {
            if (error) {
                return reject(error);
            }

            // No leave types exist yet
            const noLeaveTypes = leaveTypes.length === 0;
            if (noLeaveTypes) {
                return resolve();
            }

            const insertQuery = `
                INSERT INTO leave_balances (userId, leaveTypeId, totalDays, usedDays, remainingDays, year)
                VALUES (?, ?, ?, 0, ?, ?)
            `;

            // Insert balance for each leave type
            const insertPromises = leaveTypes.map(leaveType => {
                return new Promise((innerResolve, innerReject) => {
                    db.run(
                        insertQuery,
                        [userId, leaveType.id, leaveType.defaultDays, leaveType.defaultDays, currentYear],
                        (balanceError) => {
                            if (balanceError) innerReject(balanceError);
                            else innerResolve();
                        }
                    );
                });
            });

            Promise.all(insertPromises)
                .then(() => resolve())
                .catch((balanceError) => reject(balanceError));
        });
    });
};

/**
 * Update leave balance after leave approval
 */
const updateLeaveBalance = (userId, leaveTypeId, daysUsed) => {
    return new Promise((resolve, reject) => {
        const currentYear = new Date().getFullYear();

        const updateQuery = `
            UPDATE leave_balances
            SET usedDays = usedDays + ?,
                remainingDays = remainingDays - ?
            WHERE userId = ? AND leaveTypeId = ? AND year = ?
        `;

        db.run(
            updateQuery,
            [daysUsed, daysUsed, userId, leaveTypeId, currentYear],
            function(error) {
                if (error) {
                    return reject(error);
                }

                const wasUpdated = this.changes > 0;
                if (!wasUpdated) {
                    return reject(new Error('Leave balance not found'));
                }

                resolve();
            }
        );
    });
};

/**
 * Check if user has sufficient balance
 */
const checkSufficientBalance = (userId, leaveTypeId, daysRequired) => {
    return new Promise((resolve, reject) => {
        const currentYear = new Date().getFullYear();

        const query = `
            SELECT remainingDays
            FROM leave_balances
            WHERE userId = ? AND leaveTypeId = ? AND year = ?
        `;

        db.get(query, [userId, leaveTypeId, currentYear], (error, balance) => {
            if (error) {
                return reject(error);
            }

            if (!balance) {
                return resolve(false);
            }

            const hasSufficientBalance = balance.remainingDays >= daysRequired;
            resolve(hasSufficientBalance);
        });
    });
};

module.exports = {
    getMyLeaveBalances,
    getUserLeaveBalances,
    initializeUserBalances,
    updateLeaveBalance,
    checkSufficientBalance
};
