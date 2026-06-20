const pool = require('../db');
const { uploadToCloudinary } = require('../middleware/upload');
const { v2: cloudinary } = require('cloudinary');

// ── Helpers ──────────────────────────────────────────────────────────────
const VALID_STATUSES = ['available', 'reserved', 'unavailable'];

function statusToVisibility(status) {
    // unavailable books are hidden from the public
    return status === 'unavailable' ? false : true;
}

// ── Public: get all visible books ───────────────────────────────────────
async function getAllBooks(req, res) {
    try {
        const result = await pool.query(
            `SELECT b.*, u.name AS owner_name,
                COALESCE(
                    JSON_AGG(bi.image_path ORDER BY bi.display_order) FILTER (WHERE bi.id IS NOT NULL),
                    '[]'
                ) AS images
             FROM books b
             JOIN users u ON u.id = b.owner_id
             LEFT JOIN book_images bi ON bi.book_id = b.id
             WHERE b.is_visible = TRUE
             GROUP BY b.id, u.name
             ORDER BY b.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('getAllBooks error:', err);
        res.status(500).json({ error: 'فشل تحميل الكتب' });
    }
}

// ── Public: search visible books ────────────────────────────────────────
async function searchBooks(req, res) {
    try {
        const { q, condition } = req.query;
        const conditions = ['b.is_visible = TRUE'];
        const params = [];

        if (q) {
            params.push(`%${q}%`);
            conditions.push(`(b.title ILIKE $${params.length} OR b.description ILIKE $${params.length})`);
        }
        if (condition) {
            params.push(condition);
            conditions.push(`b.condition = $${params.length}`);
        }

        const result = await pool.query(
            `SELECT b.*, u.name AS owner_name,
                COALESCE(
                    JSON_AGG(bi.image_path ORDER BY bi.display_order) FILTER (WHERE bi.id IS NOT NULL),
                    '[]'
                ) AS images
             FROM books b
             JOIN users u ON u.id = b.owner_id
             LEFT JOIN book_images bi ON bi.book_id = b.id
             WHERE ${conditions.join(' AND ')}
             GROUP BY b.id, u.name
             ORDER BY b.created_at DESC`,
            params
        );
        res.json(result.rows);
    } catch (err) {
        console.error('searchBooks error:', err);
        res.status(500).json({ error: 'فشل البحث' });
    }
}

// ── Get single book (owner/admin can see hidden, others get 404) ─────────
async function getBook(req, res) {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT b.*, u.name AS owner_name, u.email AS owner_email,
                COALESCE(
                    JSON_AGG(bi.image_path ORDER BY bi.display_order) FILTER (WHERE bi.id IS NOT NULL),
                    '[]'
                ) AS images,
                COALESCE(
                    JSON_AGG(JSON_BUILD_OBJECT('id', bi.id, 'path', bi.image_path) ORDER BY bi.display_order) FILTER (WHERE bi.id IS NOT NULL),
                    '[]'
                ) AS image_objects
             FROM books b
             JOIN users u ON u.id = b.owner_id
             LEFT JOIN book_images bi ON bi.book_id = b.id
             WHERE b.id = $1
             GROUP BY b.id, u.name, u.email`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'الكتاب غير موجود' });
        }

        const book = result.rows[0];
        const isOwner = req.user && req.user.id === book.owner_id;
        const isAdmin = req.user && req.user.role === 'admin';

        if (!book.is_visible && !isOwner && !isAdmin) {
            return res.status(404).json({ error: 'الكتاب غير موجود' });
        }

        res.json(book);
    } catch (err) {
        console.error('getBook error:', err);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
}

// ── Authenticated: get current user's books (all statuses) ───────────────
async function getUserBooks(req, res) {
    try {
        const result = await pool.query(
            `SELECT b.*,
                COALESCE(
                    JSON_AGG(bi.image_path ORDER BY bi.display_order) FILTER (WHERE bi.id IS NOT NULL),
                    '[]'
                ) AS images
             FROM books b
             LEFT JOIN book_images bi ON bi.book_id = b.id
             WHERE b.owner_id = $1
             GROUP BY b.id
             ORDER BY b.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('getUserBooks error:', err);
        res.status(500).json({ error: 'فشل تحميل كتبك' });
    }
}

// ── Add book ───────────────────────────────────────────────────────────
async function addBook(req, res) {
    try {
        const { title, description, condition, images } = req.body;

        if (!title || !description || !condition) {
            return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب تعبئتها' });
        }
        if (!['New', 'Used'].includes(condition)) {
            return res.status(400).json({ error: 'حالة الكتاب غير صالحة' });
        }

        // Create book (image_url stays null — images go to book_images table)
        const result = await pool.query(
            `INSERT INTO books (title, description, condition, image_url, owner_id, status, is_visible, is_available)
             VALUES ($1, $2, $3, NULL, $4, 'available', TRUE, TRUE)
             RETURNING *`,
            [title, description, condition, req.user.id]
        );

        const bookId = result.rows[0].id;

        // Save images to book_images table (image_path is TEXT — can hold base64)
        if (Array.isArray(images) && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                await pool.query(
                    'INSERT INTO book_images (book_id, image_path, display_order) VALUES ($1, $2, $3)',
                    [bookId, images[i], i]
                );
            }
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('addBook error:', err.message);
        res.status(500).json({ error: 'فشل إضافة الكتاب: ' + err.message });
    }
}
// ── Update book (owner only) ──────────────────────────────────────────────
async function updateBook(req, res) {
    try {
        const { id } = req.params;
        const { title, description, condition, status, image_url } = req.body;

        // Fetch book to verify ownership
        const existing = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'الكتاب غير موجود' });
        }

        const book = existing.rows[0];

        // Security: only the owner (or an admin) may edit
        if (book.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ليس لديك صلاحية تعديل هذا الكتاب' });
        }

        if (condition && !['New', 'Used'].includes(condition)) {
            return res.status(400).json({ error: 'حالة الكتاب غير صالحة' });
        }

        let newStatus = book.status;
        if (status) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({ error: 'حالة التوفر غير صالحة' });
            }
            newStatus = status;
        }

        const isVisible = statusToVisibility(newStatus);
        const isAvailable = newStatus === 'available'; // legacy column kept in sync

        const result = await pool.query(
            `UPDATE books
             SET title       = COALESCE($1, title),
                 description = COALESCE($2, description),
                 condition   = COALESCE($3, condition),
                 image_url   = $4,
                 status      = $5,
                 is_visible  = $6,
                 is_available = $7,
                 updated_at  = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [
                title ?? null,
                description ?? null,
                condition ?? null,
                image_url ?? book.image_url,
                newStatus,
                isVisible,
                isAvailable,
                id,
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('updateBook error:', err);
        res.status(500).json({ error: 'فشل تحديث الكتاب' });
    }
}

// ── Delete book (owner only) ──────────────────────────────────────────────
async function deleteBook(req, res) {
    try {
        const { id } = req.params;

        const existing = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'الكتاب غير موجود' });
        }

        const book = existing.rows[0];
        if (book.owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ليس لديك صلاحية حذف هذا الكتاب' });
        }

        await pool.query('DELETE FROM books WHERE id = $1', [id]);
        res.json({ message: 'تم حذف الكتاب بنجاح' });
    } catch (err) {
        console.error('deleteBook error:', err);
        res.status(500).json({ error: 'فشل حذف الكتاب' });
    }
}

// ── Upload images for a book (base64 JSON) ─────────────────────────────
async function uploadBookImagesBase64(req, res) {
    try {
        const { id } = req.params;
        const { images } = req.body;

        const existing = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'الكتاب غير موجود' });
        if (existing.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ليس لديك صلاحية' });
        }

        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ error: 'لم يتم إرسال أي صور' });
        }

        const orderResult = await pool.query(
            'SELECT COALESCE(MAX(display_order), -1) AS max_order FROM book_images WHERE book_id = $1',
            [id]
        );
        let order = orderResult.rows[0].max_order + 1;

        const inserted = [];
        for (const base64 of images) {
            const row = await pool.query(
                'INSERT INTO book_images (book_id, image_path, display_order) VALUES ($1, $2, $3) RETURNING *',
                [id, base64, order++]
            );
            inserted.push(row.rows[0]);
        }

        res.status(201).json({ message: 'تم رفع الصور بنجاح', images: inserted });
    } catch (err) {
        console.error('uploadBookImagesBase64 error:', err.message);
        res.status(500).json({ error: 'فشل رفع الصور: ' + err.message });
    }
}

// ── Upload images for a book (multipart, kept for compatibility) ───────────
async function uploadBookImages(req, res) {
    try {
        const { id } = req.params;

        // Verify ownership
        const existing = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'الكتاب غير موجود' });
        if (existing.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ليس لديك صلاحية' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'لم يتم رفع أي صور' });
        }

        // Get current max display_order
        const orderResult = await pool.query(
            'SELECT COALESCE(MAX(display_order), -1) AS max_order FROM book_images WHERE book_id = $1',
            [id]
        );
        let order = orderResult.rows[0].max_order + 1;

        const inserted = [];
        for (const file of req.files) {
            // Upload buffer to Cloudinary
            const cloudUrl = await uploadToCloudinary(file.buffer, 'book-exchange');

            const row = await pool.query(
                'INSERT INTO book_images (book_id, image_path, display_order) VALUES ($1, $2, $3) RETURNING *',
                [id, cloudUrl, order++]
            );
            inserted.push(row.rows[0]);
        }

        // Also update the book's image_url to the first uploaded image
        if (inserted.length > 0) {
            await pool.query('UPDATE books SET image_url = $1 WHERE id = $2', [inserted[0].image_path, id]);
        }

        res.status(201).json({ message: 'تم رفع الصور بنجاح', images: inserted });
    } catch (err) {
        console.error('uploadBookImages error:', err);
        res.status(500).json({ error: 'فشل رفع الصور: ' + err.message });
    }
}

// ── Delete a single book image ────────────────────────────────────────────
async function deleteBookImage(req, res) {
    try {
        const { id, imageId } = req.params;

        // Verify ownership
        const existing = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ error: 'الكتاب غير موجود' });
        if (existing.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'ليس لديك صلاحية' });
        }

        const imgResult = await pool.query('SELECT * FROM book_images WHERE id = $1 AND book_id = $2', [imageId, id]);
        if (imgResult.rows.length === 0) return res.status(404).json({ error: 'الصورة غير موجودة' });

        const imgRow = imgResult.rows[0];

        // If it's a Cloudinary URL, delete from Cloudinary too
        if (imgRow.image_path && imgRow.image_path.includes('cloudinary.com')) {
            try {
                // Extract public_id from URL (last path segment without extension)
                const parts = imgRow.image_path.split('/');
                const fileWithExt = parts[parts.length - 1];
                const folder = parts[parts.length - 2];
                const publicId = `${folder}/${fileWithExt.split('.')[0]}`;
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudErr) {
                console.warn('Cloudinary delete warning:', cloudErr.message);
            }
        }

        await pool.query('DELETE FROM book_images WHERE id = $1', [imageId]);
        res.json({ message: 'تم حذف الصورة' });
    } catch (err) {
        console.error('deleteBookImage error:', err);
        res.status(500).json({ error: 'فشل حذف الصورة' });
    }
}

module.exports = {
    getAllBooks,
    getBook,
    addBook,
    updateBook,
    deleteBook,
    searchBooks,
    getUserBooks,
    uploadBookImages,
    uploadBookImagesBase64,
    deleteBookImage,
};