const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
    try {
        const email = process.env.SELLER_EMAIL || 'admin@globotv.com';
        const username = (process.env.SELLER_USERNAME || 'charaf_ben').trim().toLowerCase();
        const password = process.env.SELLER_PASSWORD || 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // The schema seeds charaf_ben without an email. Find the admin by either
        // configured identifier so repeated startup does not try to insert the
        // same case-insensitive unique username again.
        const check = await pool.query(
            `SELECT id, email, username
             FROM sellers
             WHERE LOWER(TRIM(username)) = LOWER(TRIM($1))
                OR LOWER(TRIM(email)) = LOWER(TRIM($2))
             ORDER BY CASE
                 WHEN LOWER(TRIM(email)) = LOWER(TRIM($2)) THEN 0
                 ELSE 1
             END
             LIMIT 1`,
            [username, email]
        );
        if (check.rows.length > 0) {
            const existingSeller = check.rows[0];
            // Do not overwrite another seller's username if the configured
            // admin email and username belong to different accounts.
            const usernameIsTakenByOther = await pool.query(
                `SELECT id FROM sellers
                 WHERE LOWER(TRIM(username)) = LOWER(TRIM($1)) AND id <> $2`,
                [username, existingSeller.id]
            );
            if (usernameIsTakenByOther.rows.length > 0) {
                throw new Error(`Configured admin username '${username}' belongs to a different seller`);
            }
            await pool.query(
                'UPDATE sellers SET password_hash = $1, username = $2, email = COALESCE(email, $3), name = $4 WHERE id = $5',
                [hash, username, email, 'GloboTV Admin', existingSeller.id]
            );
            console.log(`Updated password for existing admin seller: ${email}`);
        } else {
            await pool.query('INSERT INTO sellers (name, email, username, password_hash) VALUES ($1, $2, $3, $4)', [
                'GloboTV Admin',
                email,
                username,
                hash
            ]);
            console.log(`Created new seller: ${email}`);
        }

        // Test verification
        const verify = await pool.query('SELECT password_hash FROM sellers WHERE email = $1', [email]);
        const match = await bcrypt.compare(password, verify.rows[0].password_hash);
        console.log(`Verification test with '${password}':`, match ? 'SUCCESS' : 'FAILED');

        await pool.end();
    } catch (err) {
        console.error('Error resetting admin:', err);
        process.exit(1);
    }
}

resetAdmin();
