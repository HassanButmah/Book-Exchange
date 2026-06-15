const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Initialize database schema on startup
async function initializeDatabase() {
    try {
        // Drop existing tables to ensure clean slate with new schema
      //  await pool.query(`DROP TABLE IF EXISTS exchange_requests CASCADE;`);
        //await pool.query(`DROP TABLE IF EXISTS books CASCADE;`);
        //await pool.query(`DROP TABLE IF EXISTS verification_codes CASCADE;`);
        //await pool.query(`DROP TABLE IF EXISTS users CASCADE;`);

        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create verification_codes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS verification_codes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create books table (for exchange, not sale)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS books (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                condition VARCHAR(50) NOT NULL CHECK (condition IN ('New', 'Used')),
                image_url VARCHAR(500),
                owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // ── Schema migrations (idempotent) ──────────────────────────────────
        // Add role to users (admin / user)
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';`);

        // Add availability workflow columns to books
        await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';`);
        await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;`);
        await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

        // Back-fill any rows that pre-date these columns
        await pool.query(`
            UPDATE books
            SET
                status     = CASE WHEN is_available = TRUE THEN 'available' ELSE 'unavailable' END,
                is_visible = CASE WHEN is_available = TRUE THEN TRUE ELSE FALSE END,
                updated_at = COALESCE(updated_at, created_at)
            WHERE status IS NULL OR status = '';
        `);

        // Create exchange_requests table for tracking trades
        await pool.query(`
            CREATE TABLE IF NOT EXISTS exchange_requests (
                id SERIAL PRIMARY KEY,
                book_offered_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
                book_requested_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
                requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create messages table for student-to-student communication about books
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create book_images table for multiple images per book
        await pool.query(`
            CREATE TABLE IF NOT EXISTS book_images (
                id SERIAL PRIMARY KEY,
                book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
                image_path VARCHAR(500) NOT NULL,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✓ Database schema initialized');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

module.exports = pool;
module.exports.initializeDatabase = initializeDatabase;
