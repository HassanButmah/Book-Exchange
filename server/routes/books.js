const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
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
} = require('../controllers/bookController');

// ── Public routes ────────────────────────────────────────────────────────
router.get('/',              getAllBooks);
router.get('/search',        searchBooks);

// ── Requires auth ────────────────────────────────────────────────────────
router.get('/user/my-books', authMiddleware, requireAuth, getUserBooks);

// Single book — auth optional
router.get('/:id',           authMiddleware, getBook);

router.post('/',             authMiddleware, requireAuth, addBook);
router.put('/:id',           authMiddleware, requireAuth, updateBook);
router.delete('/:id',        authMiddleware, requireAuth, deleteBook);

// Image management
router.post('/:id/images/base64',     authMiddleware, requireAuth, uploadBookImagesBase64);
router.post('/:id/images',            authMiddleware, requireAuth, upload.array('images', 5), uploadBookImages);
router.delete('/:id/images/:imageId', authMiddleware, requireAuth, deleteBookImage);

module.exports = router;

