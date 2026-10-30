const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function initDB() {
    let client;
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
        const schemaName = dbUser.replace(/"/g, '""');
        client = await pool.connect();
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
        await client.query(`SET search_path TO "${schemaName}", public;`);
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        await client.query(schema);
        console.log('Database initialized successfully with schema and sample data!');
    } catch (err) {
        console.error('Database initialization failed:', err.message);
        process.exitCode = 1;
    } finally {
        client?.release();
        await pool.end();
    }
}

initDB();
