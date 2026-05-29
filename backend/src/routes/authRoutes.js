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
  verifyToken,
  deleteAccount,
  updateTimezone,
  toggleTwoFactor,
  getActiveSessions,
  getUserStats,
  getUserPreferences,
  updateNotifications,
  updateEditorPreferences,
  updatePrivacySettings,
  updateFontSize
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  loginLimiter, 
  signupLimiter, 
  otpLimiter, 
  resetPasswordLimiter 
} from '../middleware/rateLimiter.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
router.post('/register', signupLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Auth & Session
router.post('/logout', protect, logoutUser);
router.get('/verify', protect, verifyToken);

// Profile Management
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/avatar', protect, uploadAvatar);

// ============================================
// ACCOUNT MANAGEMENT ROUTES
// ============================================
router.delete('/delete-account', protect, deleteAccount);

// ============================================
// USER PREFERENCES ROUTES
// ============================================
router.get('/preferences', protect, getUserPreferences);
router.put('/timezone', protect, updateTimezone);
router.put('/font-size', protect, updateFontSize);

// ============================================
// NOTIFICATION SETTINGS
// ============================================
router.put('/notifications', protect, updateNotifications);

// ============================================
// EDITOR PREFERENCES
// ============================================
router.put('/editor-preferences', protect, updateEditorPreferences);

// ============================================
// PRIVACY SETTINGS
// ============================================
router.put('/privacy', protect, updatePrivacySettings);

// ============================================
// SECURITY SETTINGS
// ============================================
router.put('/two-factor', protect, toggleTwoFactor);
router.get('/sessions', protect, getActiveSessions);

// ============================================
// STATS & DASHBOARD
// ============================================
router.get('/stats', protect, getUserStats);

export default router;