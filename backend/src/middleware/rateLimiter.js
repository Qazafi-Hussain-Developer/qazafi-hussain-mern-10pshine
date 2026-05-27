// backend/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Rate limiter for login attempts (5 attempts per 15 minutes)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for signup attempts (3 attempts per hour)
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: {
    success: false,
    message: 'Too many signup attempts. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for OTP requests (3 attempts per 10 minutes)
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 attempts
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 10 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password reset (3 attempts per hour)
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: {
    success: false,
    message: 'Too many reset attempts. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter (100 requests per 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for sensitive operations (10 requests per hour)
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests
  message: {
    success: false,
    message: 'Too many requests. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});