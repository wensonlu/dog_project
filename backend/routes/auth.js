const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  getProfileCompletion,
  createMobileTicket,
  exchangeMobileTicket
} = require('../controllers/authController');
const checkSupabase = require('../middleware/supabaseCheck');
const { authenticateUser } = require('../middleware/checkPermission');

// Register
router.post('/register', checkSupabase, register);

// Login
router.post('/login', checkSupabase, login);

// Create one-time mobile ticket (requires bearer token)
router.post('/mobile-ticket', checkSupabase, createMobileTicket);

// Exchange one-time mobile ticket
router.post('/mobile-ticket/exchange', checkSupabase, exchangeMobileTicket);

// Get user profile completion
router.get('/profile/:id/completion', checkSupabase, authenticateUser(), getProfileCompletion);

// Get user profile
router.get('/profile/:id', getProfile);

// Update user profile
router.put('/profile/:id', updateProfile);

module.exports = router;
