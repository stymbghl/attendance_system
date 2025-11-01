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

module.exports = {
    getMyReport,
    getAllUsersReport
};
