const db = require('../config/db');
const { checkSufficientBalance, updateLeaveBalance } = require('./leaveBalancesController');

/**
 * Calculate number of days between two dates (inclusive)
 */
const calculateDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
};

/**
 * Generate array of dates between start and end (inclusive)
 */
const generateDateRange = (startDate, endDate) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const current = new Date(start);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

/**
 * Check for overlapping leave requests
 */
const checkOverlappingLeaves = (userId, startDate, endDate) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT id FROM leave_requests
            WHERE userId = ?
            AND status != 'rejected'
            AND (
                (startDate <= ? AND endDate >= ?)
                OR (startDate <= ? AND endDate >= ?)
                OR (startDate >= ? AND endDate <= ?)
            )
        `;

        db.get(
            query,
            [userId, startDate, startDate, endDate, endDate, startDate, endDate],
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                const hasOverlap = !!result;
                resolve(hasOverlap);
            }
        );
    });
};

/**
 * Create a new leave request
 */
const createLeaveRequest = async (req, res) => {
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!leaveTypeId || !startDate || !endDate) {
        return res.status(400).json({
            message: 'Leave type, start date, and end date are required'
        });
    }

    // Validate date range
    const isValidDateRange = new Date(startDate) <= new Date(endDate);
    if (!isValidDateRange) {
        return res.status(400).json({
            message: 'Start date must be before or equal to end date'
        });
    }

    // Check if dates are not too far in the past
    const today = new Date();
    const start = new Date(startDate);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const isBackdated = start < sevenDaysAgo;
    if (isBackdated) {
        return res.status(400).json({
            message: 'Cannot request leave more than 7 days in the past'
        });
    }

    try {
        // Check for overlapping leaves
        const hasOverlap = await checkOverlappingLeaves(userId, startDate, endDate);
        if (hasOverlap) {
            return res.status(400).json({
                message: 'You already have a leave request for this date range'
            });
        }

        // Calculate days required
        const daysRequired = calculateDaysBetween(startDate, endDate);

        // Check if user has sufficient balance
        const hasSufficientBalance = await checkSufficientBalance(userId, leaveTypeId, daysRequired);
        if (!hasSufficientBalance) {
            return res.status(400).json({
                message: 'Insufficient leave balance for this request'
            });
        }

        // Insert leave request
        const insertQuery = `
            INSERT INTO leave_requests (userId, leaveTypeId, startDate, endDate, reason, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `;

        db.run(
            insertQuery,
            [userId, leaveTypeId, startDate, endDate, reason || ''],
            function(error) {
                if (error) {
                    return res.status(500).json({ message: 'Error creating leave request' });
                }

                res.status(201).json({
                    message: 'Leave request created successfully',
                    requestId: this.lastID
                });
            }
        );

    } catch (error) {
        console.error('Create leave request error:', error);
        res.status(500).json({ message: 'Error creating leave request' });
    }
};

/**
 * Get leave requests for the authenticated user
 */
const getMyLeaveRequests = (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
        SELECT
            lr.id,
            lr.startDate,
            lr.endDate,
            lr.reason,
            lr.status,
            lr.createdAt,
            lr.approvedAt,
            lt.name as leaveTypeName,
            u.name as approvedByName
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leaveTypeId = lt.id
        LEFT JOIN users u ON lr.approvedBy = u.id
        WHERE lr.userId = ?
    `;

    const params = [userId];

    // Filter by status if provided
    if (status) {
        query += ' AND lr.status = ?';
        params.push(status);
    }

    query += ' ORDER BY lr.createdAt DESC';

    db.all(query, params, (error, requests) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching leave requests' });
        }
        res.json(requests);
    });
};

/**
 * Get all pending leave requests (admin only)
 */
const getPendingLeaveRequests = (req, res) => {
    const query = `
        SELECT
            lr.id,
            lr.startDate,
            lr.endDate,
            lr.reason,
            lr.status,
            lr.createdAt,
            lt.name as leaveTypeName,
            lt.id as leaveTypeId,
            u.id as userId,
            u.name as userName,
            u.email as userEmail,
            lb.remainingDays as userRemainingDays
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leaveTypeId = lt.id
        JOIN users u ON lr.userId = u.id
        LEFT JOIN leave_balances lb ON lr.userId = lb.userId AND lr.leaveTypeId = lb.leaveTypeId AND lb.year = ?
        WHERE lr.status = 'pending'
        ORDER BY lr.createdAt ASC
    `;

    const currentYear = new Date().getFullYear();

    db.all(query, [currentYear], (error, requests) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching pending leave requests' });
        }
        res.json(requests);
    });
};

/**
 * Get all leave requests (admin only)
 */
const getAllLeaveRequests = (req, res) => {
    const { status, userId } = req.query;

    let query = `
        SELECT
            lr.id,
            lr.startDate,
            lr.endDate,
            lr.reason,
            lr.status,
            lr.createdAt,
            lr.approvedAt,
            lt.name as leaveTypeName,
            u.id as userId,
            u.name as userName,
            u.email as userEmail,
            approver.name as approvedByName
        FROM leave_requests lr
        JOIN leave_types lt ON lr.leaveTypeId = lt.id
        JOIN users u ON lr.userId = u.id
        LEFT JOIN users approver ON lr.approvedBy = approver.id
        WHERE 1=1
    `;

    const params = [];

    if (status) {
        query += ' AND lr.status = ?';
        params.push(status);
    }

    if (userId) {
        query += ' AND lr.userId = ?';
        params.push(userId);
    }

    query += ' ORDER BY lr.createdAt DESC';

    db.all(query, params, (error, requests) => {
        if (error) {
            return res.status(500).json({ message: 'Error fetching leave requests' });
        }
        res.json(requests);
    });
};

/**
 * Approve a leave request (admin only)
 */
const approveLeaveRequest = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    try {
        // Get the leave request
        const getRequestQuery = `
            SELECT lr.*, lt.name as leaveTypeName
            FROM leave_requests lr
            JOIN leave_types lt ON lr.leaveTypeId = lt.id
            WHERE lr.id = ?
        `;

        const request = await new Promise((resolve, reject) => {
            db.get(getRequestQuery, [id], (error, row) => {
                if (error) reject(error);
                else resolve(row);
            });
        });

        if (!request) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        const isAlreadyProcessed = request.status !== 'pending';
        if (isAlreadyProcessed) {
            return res.status(400).json({
                message: `Leave request already ${request.status}`
            });
        }

        // Calculate days
        const daysRequired = calculateDaysBetween(request.startDate, request.endDate);

        // Check if user still has sufficient balance
        const hasSufficientBalance = await checkSufficientBalance(
            request.userId,
            request.leaveTypeId,
            daysRequired
        );

        if (!hasSufficientBalance) {
            return res.status(400).json({
                message: 'User no longer has sufficient leave balance'
            });
        }

        // Update leave balance
        await updateLeaveBalance(request.userId, request.leaveTypeId, daysRequired);

        // Create attendance entries for each day
        const dates = generateDateRange(request.startDate, request.endDate);
        const attendanceInsertQuery = `
            INSERT INTO attendance (userId, date, hasConsent, type, leaveRequestId)
            VALUES (?, ?, 1, 'leave', ?)
        `;

        for (const date of dates) {
            await new Promise((resolve, reject) => {
                db.run(attendanceInsertQuery, [request.userId, date, id], (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        }

        // Update leave request status
        const updateQuery = `
            UPDATE leave_requests
            SET status = 'approved', approvedBy = ?, approvedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await new Promise((resolve, reject) => {
            db.run(updateQuery, [adminId, id], (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        res.json({ message: 'Leave request approved successfully' });

    } catch (error) {
        console.error('Approve leave request error:', error);
        res.status(500).json({ message: 'Error approving leave request' });
    }
};

/**
 * Reject a leave request (admin only)
 */
const rejectLeaveRequest = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    try {
        // Get the leave request
        const getRequestQuery = 'SELECT * FROM leave_requests WHERE id = ?';

        const request = await new Promise((resolve, reject) => {
            db.get(getRequestQuery, [id], (error, row) => {
                if (error) reject(error);
                else resolve(row);
            });
        });

        if (!request) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        const isAlreadyProcessed = request.status !== 'pending';
        if (isAlreadyProcessed) {
            return res.status(400).json({
                message: `Leave request already ${request.status}`
            });
        }

        // Update leave request status
        const updateQuery = `
            UPDATE leave_requests
            SET status = 'rejected', approvedBy = ?, approvedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await new Promise((resolve, reject) => {
            db.run(updateQuery, [adminId, id], (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        res.json({ message: 'Leave request rejected successfully' });

    } catch (error) {
        console.error('Reject leave request error:', error);
        res.status(500).json({ message: 'Error rejecting leave request' });
    }
};

module.exports = {
    createLeaveRequest,
    getMyLeaveRequests,
    getPendingLeaveRequests,
    getAllLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest
};
