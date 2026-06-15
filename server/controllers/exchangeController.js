const pool = require('../db');

// Request an exchange (user wants to trade their book for another's)
const requestExchange = async (req, res) => {
    try {
        const { bookRequestedId, bookOfferedId } = req.body;
        const requesterId = req.user.id;

        // Verify books exist
        const bookRequested = await pool.query('SELECT * FROM books WHERE id = $1', [bookRequestedId]);
        const bookOffered = await pool.query('SELECT * FROM books WHERE id = $1', [bookOfferedId]);

        if (bookRequested.rows.length === 0 || bookOffered.rows.length === 0) {
            return res.status(404).json({ error: 'One or both books not found' });
        }

        // Verify requester owns the book they're offering
        if (bookOffered.rows[0].owner_id !== requesterId) {
            return res.status(403).json({ error: 'You can only offer books you own' });
        }

        // Verify books are from different users
        if (bookRequested.rows[0].owner_id === requesterId) {
            return res.status(400).json({ error: 'Cannot exchange books with yourself' });
        }

        // Verify books are available
        if (!bookRequested.rows[0].is_available || !bookOffered.rows[0].is_available) {
            return res.status(400).json({ error: 'One or both books are not available for exchange' });
        }

        // Check for existing exchange request
        const existing = await pool.query(
            'SELECT * FROM exchange_requests WHERE book_offered_id = $1 AND book_requested_id = $2 AND requester_id = $3 AND status = $4',
            [bookOfferedId, bookRequestedId, requesterId, 'pending']
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Exchange request already exists' });
        }

        // Create exchange request
        const result = await pool.query(
            'INSERT INTO exchange_requests (book_offered_id, book_requested_id, requester_id, receiver_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [bookOfferedId, bookRequestedId, requesterId, bookRequested.rows[0].owner_id]
        );

        res.json({
            message: 'Exchange request sent',
            exchange: result.rows[0]
        });
    } catch (err) {
        console.error('Exchange error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get pending exchange requests for the current user
const getExchangeRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT 
                er.id,
                er.status,
                er.created_at,
                er.requester_id,
                u1.name as requester_name,
                u1.email as requester_email,
                b1.id as book_offered_id,
                b1.title as book_offered_title,
                b1.condition as book_offered_condition,
                b1.image_url as book_offered_image,
                b2.id as book_requested_id,
                b2.title as book_requested_title,
                b2.condition as book_requested_condition,
                b2.image_url as book_requested_image
            FROM exchange_requests er
            JOIN users u1 ON er.requester_id = u1.id
            JOIN books b1 ON er.book_offered_id = b1.id
            JOIN books b2 ON er.book_requested_id = b2.id
            WHERE er.receiver_id = $1 OR er.requester_id = $1
            ORDER BY er.created_at DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Get exchange requests error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Accept an exchange request
const acceptExchange = async (req, res) => {
    try {
        const { exchangeId } = req.body;
        const userId = req.user.id;

        // Verify exchange exists and user is the receiver
        const exchange = await pool.query(
            'SELECT * FROM exchange_requests WHERE id = $1',
            [exchangeId]
        );

        if (exchange.rows.length === 0) {
            return res.status(404).json({ error: 'Exchange request not found' });
        }

        if (exchange.rows[0].receiver_id !== userId) {
            return res.status(403).json({ error: 'You can only accept exchanges you received' });
        }

        if (exchange.rows[0].status !== 'pending') {
            return res.status(400).json({ error: 'Exchange request is no longer pending' });
        }

        // Update exchange status
        await pool.query(
            'UPDATE exchange_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['accepted', exchangeId]
        );

        // Mark both books as unavailable
        await pool.query('UPDATE books SET is_available = FALSE WHERE id = $1 OR id = $2', [
            exchange.rows[0].book_offered_id,
            exchange.rows[0].book_requested_id
        ]);

        res.json({ message: 'Exchange accepted' });
    } catch (err) {
        console.error('Accept exchange error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Reject an exchange request
const rejectExchange = async (req, res) => {
    try {
        const { exchangeId } = req.body;
        const userId = req.user.id;

        // Verify exchange exists and user is the receiver
        const exchange = await pool.query(
            'SELECT * FROM exchange_requests WHERE id = $1',
            [exchangeId]
        );

        if (exchange.rows.length === 0) {
            return res.status(404).json({ error: 'Exchange request not found' });
        }

        if (exchange.rows[0].receiver_id !== userId) {
            return res.status(403).json({ error: 'You can only reject exchanges you received' });
        }

        // Update exchange status
        await pool.query(
            'UPDATE exchange_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['rejected', exchangeId]
        );

        res.json({ message: 'Exchange rejected' });
    } catch (err) {
        console.error('Reject exchange error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Cancel exchange request (by requester only)
const cancelExchange = async (req, res) => {
    try {
        const { exchangeId } = req.body;
        const userId = req.user.id;

        // Verify exchange exists and user is the requester
        const exchange = await pool.query(
            'SELECT * FROM exchange_requests WHERE id = $1',
            [exchangeId]
        );

        if (exchange.rows.length === 0) {
            return res.status(404).json({ error: 'Exchange request not found' });
        }

        if (exchange.rows[0].requester_id !== userId) {
            return res.status(403).json({ error: 'You can only cancel exchanges you requested' });
        }

        // Update exchange status
        await pool.query(
            'UPDATE exchange_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['rejected', exchangeId]
        );

        res.json({ message: 'Exchange request cancelled' });
    } catch (err) {
        console.error('Cancel exchange error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    requestExchange,
    getExchangeRequests,
    acceptExchange,
    rejectExchange,
    cancelExchange,
};
