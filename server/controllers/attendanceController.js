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

module.exports = {
    markAttendance,
    getMyAttendance
};
