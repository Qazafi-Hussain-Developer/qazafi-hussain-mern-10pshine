import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getProfile, 
  updateProfile, 
  logoutUser,
  changePassword,
  uploadAvatar,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  verifyToken
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  loginLimiter, 
  signupLimiter, 
  otpLimiter, 
  resetPasswordLimiter 
} from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', signupLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

// Protected routes
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/avatar', protect, uploadAvatar);
router.get('/verify', protect, verifyToken);

export default router;