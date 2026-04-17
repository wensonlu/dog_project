const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, getProfileCompletion } = require('../controllers/authController');
const checkSupabase = require('../middleware/supabaseCheck');
const { authenticateUser } = require('../middleware/checkPermission');

// Register
router.post('/register', checkSupabase, register);

// Login
router.post('/login', checkSupabase, login);

// Get user profile completion
router.get('/profile/:id/completion', checkSupabase, authenticateUser(), getProfileCompletion);

// Get user profile
router.get('/profile/:id', getProfile);

// Update user profile
router.put('/profile/:id', updateProfile);

module.exports = router;
