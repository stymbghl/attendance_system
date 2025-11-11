const db = require('../config/db');

/**
 * Initialize leave balances for all existing users
 * This script ensures every user has balances for all leave types
 */
async function initializeAllUserBalances() {
    console.log('Starting leave balance initialization...');

    try {
        // Get all users
        const users = await new Promise((resolve, reject) => {
            db.all('SELECT id, name, email FROM users', [], (error, rows) => {
                if (error) reject(error);
                else resolve(rows || []);
            });
        });

        console.log(`Found ${users.length} users`);

        // Get all leave types
        const leaveTypes = await new Promise((resolve, reject) => {
            db.all('SELECT id, name, defaultDays FROM leave_types', [], (error, rows) => {
                if (error) reject(error);
                else resolve(rows || []);
            });
        });

        console.log(`Found ${leaveTypes.length} leave types`);

        const currentYear = new Date().getFullYear();
        let balancesCreated = 0;
        let balancesSkipped = 0;

        // For each user, create balances for each leave type
        for (const user of users) {
            for (const leaveType of leaveTypes) {
                // Check if balance already exists
                const existing = await new Promise((resolve, reject) => {
                    db.get(
                        'SELECT id FROM leave_balances WHERE userId = ? AND leaveTypeId = ? AND year = ?',
                        [user.id, leaveType.id, currentYear],
                        (error, row) => {
                            if (error) reject(error);
                            else resolve(row);
                        }
                    );
                });

                if (existing) {
                    balancesSkipped++;
                    continue;
                }

                // Create balance
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO leave_balances (userId, leaveTypeId, totalDays, usedDays, remainingDays, year)
                         VALUES (?, ?, ?, 0, ?, ?)`,
                        [user.id, leaveType.id, leaveType.defaultDays, leaveType.defaultDays, currentYear],
                        (error) => {
                            if (error) reject(error);
                            else resolve();
                        }
                    );
                });

                balancesCreated++;
                console.log(`Created ${leaveType.name} balance for user ${user.name} (${leaveType.defaultDays} days)`);
            }
        }

        console.log('\n=== Summary ===');
        console.log(`Total users: ${users.length}`);
        console.log(`Total leave types: ${leaveTypes.length}`);
        console.log(`Balances created: ${balancesCreated}`);
        console.log(`Balances skipped (already exist): ${balancesSkipped}`);
        console.log('\nLeave balance initialization completed successfully!');

        process.exit(0);

    } catch (error) {
        console.error('Error initializing leave balances:', error);
        process.exit(1);
    }
}

// Run the initialization
initializeAllUserBalances();
