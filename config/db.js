const { Pool } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const pool = new Pool({
    ...(databaseUrl
        ? { connectionString: databaseUrl }
        : {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        }),
    // Render's external PostgreSQL URLs require TLS. Internal URLs may not.
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL connected successfully');
        client.release();
    } catch (err) {
        console.error('❌ PostgreSQL connection failed:', err.message);
    }
};

module.exports = { pool, testConnection };
