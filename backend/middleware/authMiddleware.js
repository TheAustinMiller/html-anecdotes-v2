const jwt = require('jsonwebtoken');
const db = require('../db');

// Middleware to verify JWT token from cookie and set req.user
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const user = await db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Access denied. User not found.' });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Access denied. Invalid token.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access denied. Token expired.' });
    }
    
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = authMiddleware;