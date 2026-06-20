const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../db');
require('dotenv').config();

// Guaranteed-to-exist JWT secret (env var preferred, hardcoded fallback for Vercel)
const JWT_SECRET = process.env.JWT_SECRET || 'hu_book_exchange_fallback_secret_2025_very_long_key';

// Email configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Generate 6-digit verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
async function sendVerificationEmail(email, code, name) {
    try {
        // Check if email service is configured
        const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_USER !== 'your_email@gmail.com';
        
        if (!isEmailConfigured) {
            // Dev mode: just log - useful for testing locally or on Vercel without email setup
            console.log(`\n🔑 [VERIFICATION CODE] ${email} → ${code}\n`);
            return true;
        }

        // Create transporter for this email (ensures fresh auth)
        const emailTransporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        await emailTransporter.sendMail({
            from: `"منصة تبادل الكتب - جامعة الخليل" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 رمز التحقق - HU Book Exchange',
            html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(102,126,234,.15);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:36px 24px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">📚</div>
      <h1 style="color:#fff;margin:0;font-size:22px;">منصة تبادل الكتب</h1>
      <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:14px;">جامعة الخليل</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px;">
      <h2 style="color:#2d3748;margin:0 0 8px;">مرحباً ${name || ''} 👋</h2>
      <p style="color:#718096;font-size:15px;line-height:1.6;margin:0 0 28px;">
        شكراً لتسجيلك في منصة تبادل الكتب. لإتمام إنشاء حسابك، أدخل رمز التحقق أدناه:
      </p>

      <!-- OTP Box -->
      <div style="background:#f7f8ff;border:2px dashed #667eea;border-radius:16px;padding:24px;text-align:center;margin-bottom:28px;">
        <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#667eea;font-family:monospace;">${code}</div>
        <p style="color:#a0aec0;font-size:13px;margin:10px 0 0;">صالح لمدة <strong>15 دقيقة</strong></p>
      </div>

      <p style="color:#a0aec0;font-size:13px;margin:0;">
        إذا لم تقم بالتسجيل في منصتنا، يمكنك تجاهل هذا البريد بأمان.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f7f8ff;padding:16px 32px;text-align:center;border-top:1px solid #e8eeff;">
      <p style="color:#a0aec0;font-size:12px;margin:0;">© 2025 منصة تبادل الكتب · جامعة الخليل</p>
    </div>

  </div>
</body>
</html>`,
        });

        return true;
    } catch (err) {
        console.error('Email send error:', err.message);
        // Still return true so registration succeeds; user can request resend
        return false;
    }
}


// Register controller
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate inputs
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' });
        }

        // Clean and validate email
        const cleanEmail = email.toLowerCase().trim();
        if (!cleanEmail.endsWith('@students.hebron.edu')) {
            return res.status(400).json({ 
                error: 'يجب استخدام بريد طالب جامعة الخليل (@students.hebron.edu)' 
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
            [cleanEmail]
        );
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
            [name, cleanEmail, hashedPassword]
        );

        const userId = result.rows[0].id;

        // Generate and save verification code
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Delete any old codes first (cleanup)
        await pool.query(
            'DELETE FROM verification_codes WHERE user_id = $1',
            [userId]
        );

        // Insert new code
        await pool.query(
            'INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
            [userId, code, expiresAt]
        );

        // Send email
        const emailSent = await sendVerificationEmail(cleanEmail, code, name);
        console.log(`User registered: ${cleanEmail} (ID: ${userId}), Email sent: ${emailSent}`);

        res.status(201).json({
            message: 'تم التسجيل بنجاح. تحقق من بريدك للحصول على رمز التحقق',
            userId,
            email: cleanEmail,
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Verify email controller
const verify = async (req, res) => {
    try {
        const { userId, code } = req.body;

        // Validate inputs
        if (!userId || !code) {
            return res.status(400).json({ error: 'معرّف المستخدم والرمز مطلوبان' });
        }

        // Ensure userId is a number
        const userIdNum = parseInt(userId, 10);
        if (isNaN(userIdNum)) {
            return res.status(400).json({ error: 'معرّف مستخدم غير صحيح' });
        }

        // Check verification code
        const result = await pool.query(
            'SELECT * FROM verification_codes WHERE user_id = $1 AND code = $2 AND expires_at > NOW()',
            [userIdNum, code.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'رمز خاطئ أو منتهي الصلاحية' });
        }

        // Mark user as verified
        await pool.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [userIdNum]);

        // Delete used verification code
        await pool.query('DELETE FROM verification_codes WHERE user_id = $1', [userIdNum]);

        console.log(`User verified: ID ${userIdNum}`);
        res.json({ message: 'تم التحقق من البريد بنجاح' });
    } catch (err) {
        console.error('Verify error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Login controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Check if verified
        if (!user.is_verified) {
            return res.status(400).json({ error: 'Email not verified' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

// Resend verification code
const resend = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'معرّف المستخدم مطلوب' });
        }

        const userIdNum = parseInt(userId, 10);
        if (isNaN(userIdNum)) {
            return res.status(400).json({ error: 'معرّف مستخدم غير صحيح' });
        }

        const user = await pool.query('SELECT * FROM users WHERE id = $1', [userIdNum]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        
        if (user.rows[0].is_verified) {
            return res.status(400).json({ error: 'الحساب محقق مسبقاً' });
        }

        // Delete old codes
        await pool.query('DELETE FROM verification_codes WHERE user_id = $1', [userIdNum]);

        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await pool.query(
            'INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
            [userIdNum, code, expiresAt]
        );

        const emailSent = await sendVerificationEmail(user.rows[0].email, code, user.rows[0].name);
        console.log(`Resend: New code generated for ${user.rows[0].email}, sent: ${emailSent}`);
        
        res.json({ message: 'تم إرسال رمز جديد إلى بريدك' });
    } catch (err) {
        console.error('Resend error:', err);
        res.status(500).json({ error: 'فشل إعادة الإرسال' });
    }
};

module.exports = { register, verify, login, resend };
