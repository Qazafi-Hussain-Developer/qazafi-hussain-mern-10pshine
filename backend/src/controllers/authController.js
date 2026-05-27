import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import generateToken from '../utils/generateToken.js';
import logger, { logUserActivity } from '../utils/logger.js';
import OTP from '../models/OTP.js';
import { generateOTPWithExpiry } from '../utils/generateOTP.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

// Register user (UPDATED with OTP)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('📝 Register attempt:', { name, email });

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const userExists = await pool.query('SELECT id, is_verified FROM users WHERE email = $1', [email.toLowerCase()]);

    if (userExists.rows.length > 0) {
      // If user exists but not verified, allow re-registration
      if (userExists.rows[0].is_verified === false) {
        // Delete existing unverified user
        await pool.query('DELETE FROM users WHERE email = $1 AND is_verified = false', [email.toLowerCase()]);
      } else {
        return res.status(400).json({ message: 'User already exists' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, is_verified) VALUES ($1, $2, $3, $4) RETURNING id, name, email, created_at`,
      [name, email.toLowerCase(), hashedPassword, false]
    );

    const user = result.rows[0];

    // Generate OTP for email verification
    const { otp, expiresAt } = generateOTPWithExpiry(10);
    
    // Save OTP to database
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'email_verification',
      expiresAt,
    });

    // Send verification email
    await sendVerificationEmail(email, name, otp);

    logUserActivity(name, email, 'ACCOUNT_CREATED', 'User registered, OTP sent for verification');
    logger.info(`New user registered: ${email} - OTP sent`);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email with the OTP sent.',
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error('❌ Register error details:', error);
    logger.error('Register error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      purpose: 'email_verification',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Update user as verified
    const result = await pool.query(
      'UPDATE users SET is_verified = true, updated_at = CURRENT_TIMESTAMP WHERE email = $1 RETURNING id, name, email',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    const user = result.rows[0];
    const token = generateToken(user.id);

    logUserActivity(user.name, email, 'EMAIL_VERIFIED', 'Email verified successfully');
    logger.info(`User verified: ${email}`);

    res.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    logger.error('Verify OTP error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    // Check if user exists and is not verified
    const user = await pool.query('SELECT id, name, email, is_verified FROM users WHERE email = $1', [email.toLowerCase()]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.rows[0].is_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Delete existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'email_verification' });

    // Generate new OTP
    const { otp, expiresAt } = generateOTPWithExpiry(10);
    
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'email_verification',
      expiresAt,
    });

    await sendVerificationEmail(email, user.rows[0].name, otp);

    logger.info(`OTP resent to: ${email}`);
    res.json({ success: true, message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    logger.error('Resend OTP error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Forgot password - send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const user = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email.toLowerCase()]);

    if (user.rows.length === 0) {
      // Don't reveal that user doesn't exist for security
      return res.json({ success: true, message: 'If an account exists, you will receive a password reset OTP' });
    }

    // Delete existing password reset OTPs
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'password_reset' });

    // Generate new OTP
    const { otp, expiresAt } = generateOTPWithExpiry(10);
    
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'password_reset',
      expiresAt,
    });

    await sendPasswordResetEmail(email, user.rows[0].name, otp);

    logger.info(`Password reset OTP sent to: ${email}`);
    res.json({ success: true, message: 'Password reset OTP sent to your email' });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    logger.error('Forgot password error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Reset password with OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, OTP, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      purpose: 'password_reset',
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
      [hashedPassword, email.toLowerCase()]
    );

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    logUserActivity('User', email, 'PASSWORD_RESET', 'Password reset successfully');
    logger.info(`Password reset for: ${email}`);

    res.json({ success: true, message: 'Password reset successfully! You can now login with your new password.' });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    logger.error('Reset password error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Login user (UPDATED to check verified status)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email, passwordProvided: !!password });

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const result = await pool.query('SELECT id, name, email, password, created_at, avatar, is_verified FROM users WHERE email = $1', [email.toLowerCase()]);

    console.log('👤 User found:', result.rows.length > 0 ? 'Yes' : 'No');

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(401).json({ 
        message: 'Please verify your email first. Check your inbox for the OTP.',
        requiresVerification: true 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    console.log('🔑 Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await pool.query('UPDATE users SET updated_at = CURRENT_TIMESTAMP, last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = generateToken(user.id);
    logUserActivity(user.name, email, 'LOGIN', 'User logged in');
    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        theme: 'light',
        avatar: user.avatar || null,
        isVerified: user.is_verified,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Login error details:', error);
    logger.error('Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get user profile (UPDATED)
export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at, avatar, theme, is_verified FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ 
      success: true, 
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        createdAt: result.rows[0].created_at,
        theme: result.rows[0].theme || 'light',
        avatar: result.rows[0].avatar || null,
        isVerified: result.rows[0].is_verified,
      } 
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    logger.error('Get profile error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Logout user (KEPT SAME)
export const logoutUser = async (req, res) => {
  try {
    logUserActivity(req.user.name, req.user.email, 'LOGOUT', 'User logged out');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    logger.error('Logout error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update user profile (KEPT SAME)
export const updateProfile = async (req, res) => {
  try {
    const { name, email, theme } = req.body;
    const userId = req.user.id;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email.toLowerCase());
    }
    if (theme) {
      updates.push(`theme = $${paramCount++}`);
      values.push(theme);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, name, email, created_at, theme, avatar, is_verified
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    logUserActivity(result.rows[0].name, result.rows[0].email, 'PROFILE_UPDATED', 'Profile updated');

    res.json({ 
      success: true, 
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        createdAt: result.rows[0].created_at,
        theme: result.rows[0].theme || 'light',
        avatar: result.rows[0].avatar || null,
        isVerified: result.rows[0].is_verified,
      } 
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    logger.error('Update profile error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Change password (KEPT SAME)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, userId]);

    logUserActivity(req.user.name, req.user.email, 'PASSWORD_CHANGED', 'Password updated');

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Change password error:', error);
    logger.error('Change password error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Upload avatar (KEPT SAME)
export const uploadAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    const userId = req.user.id;

    if (!avatarUrl) {
      return res.status(400).json({ message: 'Avatar URL is required' });
    }

    await pool.query(
      'UPDATE users SET avatar = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [avatarUrl, userId]
    );

    logUserActivity(req.user.name, req.user.email, 'AVATAR_UPDATED', 'Profile picture updated');

    logger.info(`Avatar updated for user: ${req.user.email}`);

    res.json({ 
      success: true, 
      message: 'Avatar updated successfully',
      avatarUrl 
    });
  } catch (error) {
    console.error('❌ Upload avatar error:', error);
    logger.error('Upload avatar error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Verify token
export const verifyToken = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, is_verified FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        isVerified: result.rows[0].is_verified,
      } 
    });
  } catch (error) {
    console.error('❌ Verify token error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};