const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const checkSupabase = require('../middleware/supabaseCheck');

// Register
router.post('/register', checkSupabase, register);

// Login
router.post('/login', checkSupabase, login);

// Get user profile
router.get('/profile/:id', getProfile);

// Update user profile
router.put('/profile/:id', updateProfile);

module.exports = router;
