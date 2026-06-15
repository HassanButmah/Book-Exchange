const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    requireAdmin,
    getAdminBooks,
    updateAdminBookStatus,
    deleteAdminBook,
    getAdminStats,
    getAdminUsers,
    deleteAdminUser,
    toggleUserVerified,
} = require('../controllers/adminController');

// All admin routes require: 1) valid JWT, 2) admin role
router.use(authMiddleware, requireAdmin);

// Stats
router.get('/stats',                  getAdminStats);

// Books
router.get('/books',                  getAdminBooks);
router.put('/books/:id/status',       updateAdminBookStatus);
router.delete('/books/:id',           deleteAdminBook);

// Users
router.get('/users',                  getAdminUsers);
router.delete('/users/:id',           deleteAdminUser);
router.patch('/users/:id/verify',     toggleUserVerified);

module.exports = router;
