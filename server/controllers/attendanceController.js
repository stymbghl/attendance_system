const db = require('../config/db');

async function markAttendance(req, res) {
    const { date, hasConsent } = req.body;
    const userId = req.user.id;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    if (hasConsent === undefined) {
        return res.status(400).json({ error: 'Consent is required' });
    }

    const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(date);
    if (!isValidDateFormat) {
        return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    try {
        // Check for duplicate entry
        const existingRecord = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id FROM attendance WHERE userId = ? AND date = ?',
                [userId, date],
                (error, row) => {
                    if (error) reject(error);
                    else resolve(row);
                }
            );
        });

        const isDuplicate = !!existingRecord;
        if (isDuplicate) {
            return res.status(409).json({ error: 'Attendance already marked for this date' });
        }

        // Insert attendance record
        const consentValue = hasConsent ? 1 : 0;

        const result = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO attendance (userId, date, hasConsent) VALUES (?, ?, ?)',
                [userId, date, consentValue],
                function(error) {
                    if (error) reject(error);
                    else resolve({ id: this.lastID });
                }
            );
        });

        res.status(201).json({
            message: 'Attendance marked successfully',
            id: result.id
        });

    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
}

async function getMyAttendance(req, res) {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    try {
        let query = 'SELECT id, date, hasConsent, createdAt FROM attendance WHERE userId = ?';
        const params = [userId];

        const hasDateRange = startDate && endDate;
        if (hasDateRange) {
            query += ' AND date >= ? AND date <= ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY date DESC';

        const records = await new Promise((resolve, reject) => {
            db.all(query, params, (error, rows) => {
                if (error) reject(error);
                else resolve(rows || []);
            });
        });

        res.status(200).json(records);

    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ error: 'Failed to retrieve attendance records' });
    }
}

/**
 * Get attendance records with detailed information including leaves
 * Supports pagination and filtering
 */
async function getAttendanceRecords(req, res) {
    const userId = req.user.id;
    const { startDate, endDate, type, page = 1, limit = 20 } = req.query;

    try {
        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build query
        let query = `
            SELECT
                a.id,
                a.date,
                a.hasConsent,
                a.type,
                a.createdAt,
                lt.name as leaveTypeName,
                lr.reason as leaveReason
            FROM attendance a
            LEFT JOIN leave_requests lr ON a.leaveRequestId = lr.id
            LEFT JOIN leave_types lt ON lr.leaveTypeId = lt.id
            WHERE a.userId = ?
        `;

        const params = [userId];

        // Add filters
        if (startDate && endDate) {
            query += ' AND a.date >= ? AND a.date <= ?';
            params.push(startDate, endDate);
        }

        if (type) {
            query += ' AND a.type = ?';
            params.push(type);
        }

        // Get total count
        const countQuery = query.replace(
            /SELECT.*FROM/s,
            'SELECT COUNT(*) as total FROM'
        );

        const countResult = await new Promise((resolve, reject) => {
            db.get(countQuery, params, (error, row) => {
                if (error) reject(error);
                else resolve(row);
            });
        });

        const totalRecords = countResult.total;
        const totalPages = Math.ceil(totalRecords / limitNum);

        // Add sorting and pagination
        query += ' ORDER BY a.date DESC LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        const records = await new Promise((resolve, reject) => {
            db.all(query, params, (error, rows) => {
                if (error) reject(error);
                else resolve(rows || []);
            });
        });

        res.status(200).json({
            records,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalRecords,
                limit: limitNum
            }
        });

    } catch (error) {
        console.error('Get attendance records error:', error);
        res.status(500).json({ error: 'Failed to retrieve attendance records' });
    }
}

module.exports = {
    markAttendance,
    getMyAttendance,
    getAttendanceRecords
};
