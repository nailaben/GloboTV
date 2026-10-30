const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initDB() {
    try {
        console.log('Connecting to PostgreSQL...');
        // DATABASE_URL is the source of truth on hosted deployments. Derive the
        // schema owner from its username when DB_USER is not set separately.
        const databaseUrl = process.env.DATABASE_URL;
        let dbUser = process.env.DB_USER;
        if (!dbUser && databaseUrl) {
            dbUser = decodeURIComponent(new URL(databaseUrl).username);
        }
        dbUser = dbUser || 'marketplace_user';
        await pool.query(`CREATE SCHEMA IF NOT EXISTS "${dbUser}";`);
        await pool.query(`SET search_path TO "${dbUser}", public;`);
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        await pool.query(schema);
        console.log('Database initialized successfully with schema and sample data!');
        process.exit(0);
    } catch (err) {
        console.error('Database initialization failed:', err.message);
        process.exit(1);
    }
}

initDB();
