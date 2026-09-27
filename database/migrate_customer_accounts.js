const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function migrateCustomerAccounts() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'customer_accounts.sql'), 'utf8');
        await pool.query(sql);
        console.log('Customer account tables are ready.');
    } catch (error) {
        console.error('Customer account migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

migrateCustomerAccounts();
