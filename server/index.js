const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const exchangeRoutes = require('./routes/exchanges');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/admin');
const pool = require('./db');
const { initializeDatabase } = require('./db');
const seedDatabase = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database schema on startup
initializeDatabase().catch(err => console.error('Database init error:', err));

// Middleware (must come before routes)
app.use(cors({
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Ensure JSON content-type
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/exchanges', exchangeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', env: process.env.NODE_ENV || 'development' });
});

// Seed endpoint — triggers DB init + seeding on demand (useful after first deploy)
app.get('/api/setup', async (req, res) => {
    try {
        await initializeDatabase();
        await seedDatabase();
        res.json({ message: '✅ Database initialized and seeded successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 404 for undefined API routes
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// SPA fallback - serve index.html for non-API routes (only root path)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel serverless
module.exports = app;



// Start server locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_DEV) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 HU Book Exchange Backend Started`);
    });
}