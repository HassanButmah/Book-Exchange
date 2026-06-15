const express = require('express');
const router = express.Router();
const { register, verify, login, resend } = require('../controllers/authController');

router.post('/register', register);
router.post('/verify',   verify);
router.post('/login',    login);
router.post('/resend',   resend);

module.exports = router;
