const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Creates and signs a JWT containing the user's id
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// POST /api/auth/register
// Validates input, checks for duplicate email, creates user, returns JWT
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic input validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Name, email, and password must be text' });
  }

  const cleanName = name.trim();
  const cleanEmail = email.toLowerCase().trim();

  if (!cleanName) {
    return res.status(400).json({ error: 'Name cannot be blank' });
  }
  if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Email format is invalid' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if this email is already registered (emails are stored lowercase)
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Create the user – the pre-save hook hashes the password automatically
    const user = await User.create({ name: cleanName, email: cleanEmail, password });
    const token = signToken(user._id);

    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    // Mongoose duplicate-key error (race condition safety net)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
// Finds user by email, verifies password, returns JWT
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password must be text' });
  }

  try {
    // Find the user and explicitly include the password for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      // Use a generic message – do not reveal whether the email exists
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me  – protected route: returns the currently logged-in user
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

module.exports = router;
