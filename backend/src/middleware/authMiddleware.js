// backend/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import logger from '../utils/logger.js';

export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Check if token exists
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const result = await pool.query(
        'SELECT id, name, email, theme, avatar, is_verified, timezone, two_factor_enabled FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach user to request object
      req.user = result.rows[0];
      req.token = token;  // Optional: for session management
      req.userId = decoded.id;  // Optional: for session management
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      logger.error('Auth middleware error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    // No authorization header
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// ✅ NEW: Middleware to check if 2FA is verified for sensitive routes
// Use this on routes that require two-factor authentication to be completed
export const requireTwoFactorVerified = (req, res, next) => {
  // Check if user has 2FA enabled and if it's verified in session
  if (req.user?.two_factor_enabled && !req.session?.twoFactorVerified) {
    return res.status(403).json({ 
      success: false,
      message: 'Two-factor authentication required. Please verify your OTP first.',
      requiresTwoFactor: true 
    });
  }
  next();
};

// Optional: Session-based 2FA verification tracker
// Call this after successful OTP verification
export const setTwoFactorVerified = (req, res, next) => {
  if (!req.session) {
    // Initialize session if not exists
    req.session = {};
  }
  req.session.twoFactorVerified = true;
  next();
};

// Optional: Clear 2FA verification on logout
export const clearTwoFactorVerified = (req, res, next) => {
  if (req.session) {
    req.session.twoFactorVerified = false;
  }
  next();
};

// Optional: Role-based authorization middleware (for future use)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Optional: Check if email is verified
export const requireVerifiedEmail = (req, res, next) => {
  if (!req.user?.is_verified) {
    return res.status(403).json({ 
      success: false,
      message: 'Email not verified. Please verify your email address first.',
      requiresVerification: true 
    });
  }
  next();
};