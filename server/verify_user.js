const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const email = '22210023@students.hebron.edu';

async function verifyUser() {
    try {
        const update = await pool.query(
            'UPDATE users SET is_verified = TRUE WHERE email = $1',
            [email]
        );
        console.log(`✅ Updated ${update.rowCount} row(s)`);

        const result = await pool.query(
            'SELECT id, name, email, is_verified FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log('❌ User not found!');
        } else {
            console.log('👤 User:', result.rows[0]);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

verifyUser();
