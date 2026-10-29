const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware: checks the Authorization header, verifies the JWT,
// and attaches the logged-in user to req.user so route handlers can use it
async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  // Expect the header to be "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token – please log in' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Decode the token; this throws if the token is expired or invalid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user but leave out the password field
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is invalid or expired' });
  }
}

module.exports = { protect };
