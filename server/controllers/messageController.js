const pool = require('../db');

// Send a message to another user about a book
const sendMessage = async (req, res) => {
    const { receiver_id, book_id, message } = req.body;
    const sender_id = req.user.id;

    if (!receiver_id || !message) {
        return res.status(400).json({ error: 'Receiver ID and message are required' });
    }

    try {
        // Verify receiver exists
        const receiverCheck = await pool.query('SELECT id FROM users WHERE id = $1', [receiver_id]);
        if (receiverCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Receiver not found' });
        }

        // Verify book exists if provided
        if (book_id) {
            const bookCheck = await pool.query('SELECT id FROM books WHERE id = $1', [book_id]);
            if (bookCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Book not found' });
            }
        }

        // Insert message
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, book_id, message)
             VALUES ($1, $2, $3, $4)
             RETURNING id, sender_id, receiver_id, book_id, message, is_read, created_at`,
            [sender_id, receiver_id, book_id || null, message]
        );

        res.status(201).json({
            success: true,
            message: 'تم إرسال الرسالة بنجاح!',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'حدث خطأ في إرسال الرسالة' });
    }
};

// Get conversation between two users
const getConversation = async (req, res) => {
    const { user_id, book_id } = req.query;
    const current_user_id = req.user.id;

    if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        let query = `
            SELECT 
                m.id, 
                m.sender_id, 
                m.receiver_id, 
                m.book_id,
                m.message,
                m.is_read,
                m.created_at,
                sender.name as sender_name,
                receiver.name as receiver_name,
                b.title as book_title
            FROM messages m
            LEFT JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN users receiver ON m.receiver_id = receiver.id
            LEFT JOIN books b ON m.book_id = b.id
            WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
               OR (m.sender_id = $2 AND m.receiver_id = $1)
        `;

        const params = [current_user_id, user_id];

        if (book_id) {
            query += ` AND m.book_id = $3`;
            params.push(book_id);
        }

        query += ` ORDER BY m.created_at ASC`;

        const result = await pool.query(query, params);

        // Mark messages as read
        await pool.query(
            `UPDATE messages SET is_read = TRUE 
             WHERE receiver_id = $1 AND sender_id = $2 AND is_read = FALSE`,
            [current_user_id, user_id]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching conversation:', err);
        res.status(500).json({ error: 'حدث خطأ في جلب الرسائل' });
    }
};

// Get all conversations (list of users user has chatted with)
const getConversations = async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await pool.query(`
            SELECT DISTINCT ON (conversation_user_id)
                CASE 
                    WHEN m.sender_id = $1 THEN m.receiver_id 
                    ELSE m.sender_id 
                END as conversation_user_id,
                CASE 
                    WHEN m.sender_id = $1 THEN receiver.name 
                    ELSE sender.name 
                END as user_name,
                CASE 
                    WHEN m.sender_id = $1 THEN receiver.email 
                    ELSE sender.email 
                END as user_email,
                m.message as last_message,
                m.created_at as last_message_time,
                COUNT(CASE WHEN m.receiver_id = $1 AND m.is_read = FALSE THEN 1 END) 
                    OVER (PARTITION BY 
                        CASE 
                            WHEN m.sender_id = $1 THEN m.receiver_id 
                            ELSE m.sender_id 
                        END) as unread_count
            FROM messages m
            LEFT JOIN users sender ON m.sender_id = sender.id
            LEFT JOIN users receiver ON m.receiver_id = receiver.id
            WHERE m.sender_id = $1 OR m.receiver_id = $1
            ORDER BY conversation_user_id, m.created_at DESC
        `, [user_id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).json({ error: 'حدث خطأ في جلب المحادثات' });
    }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await pool.query(
            `SELECT COUNT(*) as unread_count FROM messages 
             WHERE receiver_id = $1 AND is_read = FALSE`,
            [user_id]
        );

        res.json({
            success: true,
            unread_count: parseInt(result.rows[0].unread_count)
        });
    } catch (err) {
        console.error('Error fetching unread count:', err);
        res.status(500).json({ error: 'حدث خطأ في جلب عدد الرسائل غير المقروءة' });
    }
};

// Delete a message
const deleteMessage = async (req, res) => {
    const { message_id } = req.params;
    const user_id = req.user.id;

    try {
        // Verify user owns the message
        const messageCheck = await pool.query(
            `SELECT sender_id FROM messages WHERE id = $1`,
            [message_id]
        );

        if (messageCheck.rows.length === 0) {
            return res.status(404).json({ error: 'الرسالة غير موجودة' });
        }

        if (messageCheck.rows[0].sender_id !== user_id) {
            return res.status(403).json({ error: 'لا يمكنك حذف رسالة غير خاصة بك' });
        }

        await pool.query(`DELETE FROM messages WHERE id = $1`, [message_id]);

        res.json({
            success: true,
            message: 'تم حذف الرسالة بنجاح!'
        });
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).json({ error: 'حدث خطأ في حذف الرسالة' });
    }
};

module.exports = {
    sendMessage,
    getConversation,
    getConversations,
    getUnreadCount,
    deleteMessage
};
