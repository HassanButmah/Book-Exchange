const bcrypt = require('bcryptjs');
const pool = require('./db');
require('dotenv').config();

async function seedDatabase() {
    try {
        console.log('🌱 Seeding database with demo data...');

        // Demo accounts
        const demoStudentPassword = await bcrypt.hash('password123', 10);
        const adminPassword = await bcrypt.hash('admin123', 10);

        // Insert demo users
        const demoStudent = await pool.query(
            'INSERT INTO users (name, email, password_hash, is_verified) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id',
            ['Ahmed Mohammed', 'demo@students.hebron.edu', demoStudentPassword, true]
        );

        const admin = await pool.query(
            'INSERT INTO users (name, email, password_hash, is_verified) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id',
            ['Admin User', 'admin@students.hebron.edu', adminPassword, true]
        );

        // Ensure admin role is set (handles both first-run and re-seeds)
        await pool.query(
            `UPDATE users SET role = 'admin' WHERE email = 'admin@students.hebron.edu'`
        );

        if (demoStudent.rows.length > 0) {
            const userId = demoStudent.rows[0].id;

            // Insert sample books
            const sampleBooks = [
                {
                    title: 'Introduction to Computer Science',
                    description: 'Comprehensive guide covering algorithms, data structures, and programming fundamentals. Excellent condition, never used.',
                    condition: 'New',
                    image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=600&fit=crop',
                    owner_id: userId,
                },
                {
                    title: 'Data Structures and Algorithms',
                    description: 'Advanced algorithms textbook. Used but in excellent condition. Includes notes and highlights.',
                    condition: 'Used',
                    image_url: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=400&h=600&fit=crop',
                    owner_id: userId,
                },
                {
                    title: 'Web Development with JavaScript',
                    description: 'Learn modern web development. Perfect condition, barely used. Includes CD with exercises.',
                    condition: 'New',
                    image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop',
                    owner_id: userId,
                },
                {
                    title: 'Database Design Fundamentals',
                    description: 'SQL and database design principles. Used condition with some notes. Great for learning.',
                    condition: 'Used',
                    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f70504504?w=400&h=600&fit=crop',
                    owner_id: userId,
                },
                {
                    title: 'Operating Systems Concepts',
                    description: 'Comprehensive operating systems textbook. Like new condition.',
                    condition: 'New',
                    image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=600&fit=crop',
                    owner_id: userId,
                },
            ];

            for (const book of sampleBooks) {
                await pool.query(
                    'INSERT INTO books (title, description, condition, image_url, owner_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                    [book.title, book.description, book.condition, book.image_url, book.owner_id]
                );
            }

            console.log(`✓ Seeded ${sampleBooks.length} demo books`);
        }

        console.log('✓ Database seeding complete!');
        console.log('');
        console.log('📚 Demo Accounts:');
        console.log('  Student: demo@students.hebron.edu / password123');
        console.log('  Admin:   admin@students.hebron.edu / admin123');
        console.log('');

    } catch (err) {
        console.error('Error seeding database:', err);
    }
}

// Run seed if explicitly called
if (require.main === module) {
    seedDatabase().then(() => process.exit(0));
}

module.exports = seedDatabase;
