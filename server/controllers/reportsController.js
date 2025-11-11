const db = require('../config/db');
const { generateUserCSV, generateAllUsersCSV } = require('../utils/csvGenerator');

async function getMyReport(req, res) {
    const userId = req.user.id;

    try {
        const records = await new Promise((resolve, reject) => {
            db.all(
                'SELECT date, hasConsent, createdAt FROM attendance WHERE userId = ? ORDER BY date DESC',
                [userId],
                (error, rows) => {
                    if (error) reject(error);
                    else resolve(rows || []);
                }
            );
        });

        const csvContent = generateUserCSV(records);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="my-attendance.csv"');
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Generate user report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
}

async function getAllUsersReport(req, res) {
    try {
        const records = await new Promise((resolve, reject) => {
            db.all(
                `SELECT
                    u.name,
                    u.email,
                    a.date,
                    a.hasConsent,
                    a.createdAt
                FROM attendance a
                JOIN users u ON a.userId = u.id
                ORDER BY a.date DESC, u.name ASC`,
                [],
                (error, rows) => {
                    if (error) reject(error);
                    else resolve(rows || []);
                }
            );
        });

        const csvContent = generateAllUsersCSV(records);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="all-users-attendance.csv"');
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Generate all users report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
}

/**
 * Generate user's leave report CSV
 */
async function getMyLeaveReport(req, res) {
    const userId = req.user.id;

    try {
        const records = await new Promise((resolve, reject) => {
            db.all(
                `SELECT
                    lt.name as leaveType,
                    lr.startDate,
                    lr.endDate,
                    lr.reason,
                    lr.status,
                    lr.createdAt,
                    lr.approvedAt,
                    u.name as approvedBy
                FROM leave_requests lr
                JOIN leave_types lt ON lr.leaveTypeId = lt.id
                LEFT JOIN users u ON lr.approvedBy = u.id
                WHERE lr.userId = ?
                ORDER BY lr.createdAt DESC`,
                [userId],
                (error, rows) => {
                    if (error) reject(error);
                    else resolve(rows || []);
                }
            );
        });

        // Generate CSV
        let csvContent = 'Leave Type,Start Date,End Date,Reason,Status,Approved By,Submitted At,Approved At\n';

        records.forEach(record => {
            const reason = (record.reason || '').replace(/"/g, '""');
            const approvedBy = record.approvedBy || '-';
            const approvedAt = record.approvedAt || '-';

            csvContent += `"${record.leaveType}","${record.startDate}","${record.endDate}","${reason}","${record.status}","${approvedBy}","${record.createdAt}","${approvedAt}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="my-leaves.csv"');
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Generate leave report error:', error);
        res.status(500).json({ error: 'Failed to generate leave report' });
    }
}

/**
 * Generate all users' leave report CSV (admin only)
 */
async function getAllLeavesReport(req, res) {
    try {
        const records = await new Promise((resolve, reject) => {
            db.all(
                `SELECT
                    u.name as userName,
                    u.email as userEmail,
                    lt.name as leaveType,
                    lr.startDate,
                    lr.endDate,
                    lr.reason,
                    lr.status,
                    lr.createdAt,
                    lr.approvedAt,
                    approver.name as approvedBy
                FROM leave_requests lr
                JOIN users u ON lr.userId = u.id
                JOIN leave_types lt ON lr.leaveTypeId = lt.id
                LEFT JOIN users approver ON lr.approvedBy = approver.id
                ORDER BY lr.createdAt DESC`,
                [],
                (error, rows) => {
                    if (error) reject(error);
                    else resolve(rows || []);
                }
            );
        });

        // Generate CSV
        let csvContent = 'Employee Name,Email,Leave Type,Start Date,End Date,Reason,Status,Approved By,Submitted At,Approved At\n';

        records.forEach(record => {
            const reason = (record.reason || '').replace(/"/g, '""');
            const approvedBy = record.approvedBy || '-';
            const approvedAt = record.approvedAt || '-';

            csvContent += `"${record.userName}","${record.userEmail}","${record.leaveType}","${record.startDate}","${record.endDate}","${reason}","${record.status}","${approvedBy}","${record.createdAt}","${approvedAt}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="all-leaves.csv"');
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Generate all leaves report error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
}

/**
 * Get leave statistics (admin only)
 */
async function getLeaveStatistics(req, res) {
    try {
        // Get total requests by status
        const statusStats = await new Promise((resolve, reject) => {
            db.all(
                `SELECT status, COUNT(*) as count
                FROM leave_requests
                GROUP BY status`,
                [],
                (error, rows) => {
                    if (error) reject(error);
                    else resolve(rows || []);
                }
            );
        });

        // Get total requests by leave type
        const typeStats = await new Promise((resolve, reject) => {
            db.all(
                `SELECT lt.name, COUNT(*) as count
                FROM leave_requests lr
                JOIN leave_types lt ON lr.leaveTypeId = lt.id
                GROUP BY lt.name`,
                [],
                (error, rows) => {
                    if (error) reject(error);
                    else resolve(rows || []);
                }
            );
        });

        // Get top users by leave requests
        const userStats = await new Promise((resolve, reject) => {
            db.all(
                `SELECT u.name, COUNT(*) as count
                FROM leave_requests lr
                JOIN users u ON lr.userId = u.id
                GROUP BY u.name
                ORDER BY count DESC
                LIMIT 10`,
                [],
                (error, rows) => {
                    if (error) reject(error);
                    else resolve(rows || []);
                }
            );
        });

        res.json({
            byStatus: statusStats,
            byType: typeStats,
            topUsers: userStats
        });

    } catch (error) {
        console.error('Get leave statistics error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
}

module.exports = {
    getMyReport,
    getAllUsersReport,
    getMyLeaveReport,
    getAllLeavesReport,
    getLeaveStatistics
};
