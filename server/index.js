// Entry point: connects to DB then starts Express server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route files (add more here in later stages)
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const requestRoutes = require('./routes/requests');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');

const app = express();

// Robust CORS: Allow React frontend across localhost and deployed domains (Vercel, custom)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Health-check route so we can verify the server is alive
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
