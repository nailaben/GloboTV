const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        const username = (process.env.SELLER_USERNAME || 'charaf_ben').trim().toLowerCase();
        const password = process.env.SELLER_PASSWORD || 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Sellers are identified by username; the sellers table has no email
        // column. Updating by username makes this safe on repeated startups.
        const check = await pool.query(
            `SELECT id, username
             FROM sellers
             WHERE LOWER(TRIM(username)) = LOWER(TRIM($1))
             LIMIT 1`,
            [username]
        );
        if (check.rows.length > 0) {
            const existingSeller = check.rows[0];
            await pool.query(
                'UPDATE sellers SET password_hash = $1, name = $2 WHERE id = $3',
                [hash, 'GloboTV Admin', existingSeller.id]
            );
            console.log(`Updated password for existing admin seller: ${username}`);
        } else {
            await pool.query('INSERT INTO sellers (name, username, password_hash) VALUES ($1, $2, $3)', [
                'GloboTV Admin',
                username,
                hash
            ]);
            console.log(`Created new admin seller: ${username}`);
        }

        // Verify using the same username used to create or update the admin.
        const verify = await pool.query(
            'SELECT password_hash FROM sellers WHERE LOWER(TRIM(username)) = LOWER(TRIM($1))',
            [username]
        );
        if (verify.rows.length === 0) {
            throw new Error(`Admin seller '${username}' was not found after reset`);
        }
        const match = await bcrypt.compare(password, verify.rows[0].password_hash);
        console.log(`Verification test with '${password}':`, match ? 'SUCCESS' : 'FAILED');

        await pool.end();
    } catch (err) {
        console.error('Error resetting admin:', err);
        process.exit(1);
    }
}

resetAdmin();
