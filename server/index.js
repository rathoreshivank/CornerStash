// Entry point: connects to DB then starts Express server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Route files (add more here in later stages)
const authRoutes = require('./routes/auth');

const app = express();

// Allow requests from our React frontend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Health-check route so we can verify the server is alive
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Mount auth routes under /api/auth
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
