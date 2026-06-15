const pool = require('../db');
const path = require('path');
const fs = require('fs');

const VALID_STATUSES = ['available', 'reserved', 'unavailable'];

// ── Middleware: require admin role (used after authMiddleware) ───────────
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'صلاحيات المدير مطلوبة' });
    }
    next();
}

// ── Get all books (including hidden/unavailable) with owner info ─────────
async function getAdminBooks(req, res) {
    try {
        const result = await pool.query(
            `SELECT b.*, u.name AS owner_name, u.email AS owner_email
             FROM books b
             JOIN users u ON u.id = b.owner_id
             ORDER BY b.updated_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('getAdminBooks error:', err);
        res.status(500).json({ error: 'تعذّر تحميل بيانات المدير' });
    }
}

// ── Change a book's status (restore / hide / reserve) ─────────────────────
async function updateAdminBookStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'حالة غير صالحة' });
        }

        const existing = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'الكتاب غير موجود' });
        }

        const isVisible = status !== 'unavailable';
        const isAvailable = status === 'available';

        const result = await pool.query(
            `UPDATE books
             SET status = $1, is_visible = $2, is_available = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [status, isVisible, isAvailable, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('updateAdminBookStatus error:', err);
        res.status(500).json({ error: 'فشل تغيير الحالة' });
    }
}

// ── Permanently delete a book ─────────────────────────────────────────────
async function deleteAdminBook(req, res) {
    try {
        const { id } = req.params;

        const existing = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'الكتاب غير موجود' });
        }

        await pool.query('DELETE FROM books WHERE id = $1', [id]);
        res.json({ message: 'تم حذف الكتاب نهائياً' });
    } catch (err) {
        console.error('deleteAdminBook error:', err);
        res.status(500).json({ error: 'فشل الحذف' });
    }
}

// ── Admin statistics ──────────────────────────────────────────────────
async function getAdminStats(req, res) {
    try {
        const [users, books, messages, booksByStatus] = await Promise.all([
            pool.query('SELECT COUNT(*) AS count FROM users'),
            pool.query('SELECT COUNT(*) AS count FROM books'),
            pool.query('SELECT COUNT(*) AS count FROM messages'),
            pool.query(`
                SELECT
                    COUNT(*) FILTER (WHERE status = 'available')  AS available,
                    COUNT(*) FILTER (WHERE status = 'reserved')   AS reserved,
                    COUNT(*) FILTER (WHERE status = 'unavailable') AS unavailable
                FROM books
            `),
        ]);

        res.json({
            totalUsers:       parseInt(users.rows[0].count),
            totalBooks:       parseInt(books.rows[0].count),
            totalMessages:    parseInt(messages.rows[0].count),
            available:        parseInt(booksByStatus.rows[0].available),
            reserved:         parseInt(booksByStatus.rows[0].reserved),
            unavailable:      parseInt(booksByStatus.rows[0].unavailable),
        });
    } catch (err) {
        console.error('getAdminStats error:', err);
        res.status(500).json({ error: 'فشل جلب الإحصائيات' });
    }
}

// ── Get all users with their book counts ───────────────────────────────
async function getAdminUsers(req, res) {
    try {
        const result = await pool.query(`
            SELECT
                u.id, u.name, u.email, u.role, u.is_verified, u.created_at,
                COUNT(b.id)::int AS book_count
            FROM users u
            LEFT JOIN books b ON b.owner_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('getAdminUsers error:', err);
        res.status(500).json({ error: 'فشل جلب المستخدمين' });
    }
}

// ── Delete user (and all their books/messages via CASCADE) ────────────────
async function deleteAdminUser(req, res) {
    try {
        const { id } = req.params;

        const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        if (existing.rows[0].id === req.user.id) {
            return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' });
        }

        // Delete uploaded images from disk for this user's books
        const imgs = await pool.query(
            'SELECT bi.image_path FROM book_images bi JOIN books b ON b.id = bi.book_id WHERE b.owner_id = $1',
            [id]
        );
        imgs.rows.forEach(r => {
            const fp = path.join(__dirname, '..', r.image_path);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        });

        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'تم حذف المستخدم وجميع بياناته بنجاح' });
    } catch (err) {
        console.error('deleteAdminUser error:', err);
        res.status(500).json({ error: 'فشل حذف المستخدم' });
    }
}

// ── Toggle user verified status ─────────────────────────────────────
async function toggleUserVerified(req, res) {
    try {
        const { id } = req.params;
        const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });

        const newVal = !existing.rows[0].is_verified;
        await pool.query('UPDATE users SET is_verified = $1 WHERE id = $2', [newVal, id]);
        res.json({ message: newVal ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب', is_verified: newVal });
    } catch (err) {
        console.error('toggleUserVerified error:', err);
        res.status(500).json({ error: 'فشل تغيير حالة التحقق' });
    }
}

module.exports = {
    requireAdmin,
    getAdminBooks,
    updateAdminBookStatus,
    deleteAdminBook,
    getAdminStats,
    getAdminUsers,
    deleteAdminUser,
    toggleUserVerified,
};