import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import generateToken from '../utils/generateToken.js';
import logger, { logUserActivity } from '../utils/logger.js';
import { generateOTPWithExpiry } from '../utils/generateOTP.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';

// Register user (SIMPLIFIED - no OTP model dependency)
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

    // Check if user already exists
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    if (userExists.rows.length > 0) {
      console.log('⚠️ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
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
    
    // Save OTP directly to database (no OTP model)
    await pool.query(
      'INSERT INTO otps (email, otp, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [email.toLowerCase(), otp, 'email_verification', expiresAt]
    );

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

// ✅ FIXED: Verify OTP (PostgreSQL compatible) WITH WELCOME EMAIL
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('📧 Verifying OTP for:', email);
    console.log('🔢 OTP entered:', otp);

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    // Find valid OTP - Direct PostgreSQL query
    const otpResult = await pool.query(
      `SELECT * FROM otps 
       WHERE email = $1 
       AND otp = $2 
       AND purpose = 'email_verification' 
       AND expires_at > NOW()`,
      [email.toLowerCase(), otp]
    );

    console.log('📊 OTP found:', otpResult.rows.length > 0);

    if (otpResult.rows.length === 0) {
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

    const user = result.rows[0];

    // ✅ SEND WELCOME EMAIL AFTER SUCCESSFUL VERIFICATION (using Gmail)
    try {
      await sendWelcomeEmail(email, user.name);
      console.log(`📧 Welcome email sent to: ${email}`);
    } catch (welcomeError) {
      console.error('⚠️ Welcome email failed but verification succeeded:', welcomeError.message);
      // Don't block the verification if welcome email fails
    }

    // Delete used OTP
    await pool.query('DELETE FROM otps WHERE id = $1', [otpResult.rows[0].id]);

    const token = generateToken(user.id);

    logUserActivity(user.name, email, 'EMAIL_VERIFIED', 'Email verified successfully');
    logger.info(`User verified: ${email}`);

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to Lavender Notes! 🎉',
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

// ✅ FIXED: Resend OTP (PostgreSQL compatible)
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
    await pool.query('DELETE FROM otps WHERE email = $1 AND purpose = $2', [email.toLowerCase(), 'email_verification']);

    // Generate new OTP
    const { otp, expiresAt } = generateOTPWithExpiry(10);
    
    // Save OTP to database
    await pool.query(
      'INSERT INTO otps (email, otp, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [email.toLowerCase(), otp, 'email_verification', expiresAt]
    );

    await sendVerificationEmail(email, user.rows[0].name, otp);

    logger.info(`OTP resent to: ${email}`);
    res.json({ success: true, message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    logger.error('Resend OTP error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ FIXED: Forgot password - send OTP
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
    await pool.query('DELETE FROM otps WHERE email = $1 AND purpose = $2', [email.toLowerCase(), 'password_reset']);

    // Generate new OTP
    const { otp, expiresAt } = generateOTPWithExpiry(10);
    
    // Save OTP to database
    await pool.query(
      'INSERT INTO otps (email, otp, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [email.toLowerCase(), otp, 'password_reset', expiresAt]
    );

    await sendPasswordResetEmail(email, user.rows[0].name, otp);

    logger.info(`Password reset OTP sent to: ${email}`);
    res.json({ success: true, message: 'Password reset OTP sent to your email' });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    logger.error('Forgot password error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ FIXED: Reset password with OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, OTP, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Find valid OTP - Direct PostgreSQL query
    const otpResult = await pool.query(
      `SELECT * FROM otps 
       WHERE email = $1 
       AND otp = $2 
       AND purpose = 'password_reset' 
       AND expires_at > NOW()`,
      [email.toLowerCase(), otp]
    );

    if (otpResult.rows.length === 0) {
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
    await pool.query('DELETE FROM otps WHERE id = $1', [otpResult.rows[0].id]);

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

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at, avatar, theme, is_verified, timezone, two_factor_enabled, bio,
              notification_email, notification_push, notification_marketing,
              editor_auto_save, editor_word_count, editor_default_category,
              privacy_show_email, privacy_allow_search, font_size
       FROM users WHERE id = $1`,
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
        timezone: result.rows[0].timezone || 'Pacific Standard Time (PST)',
        twoFactorEnabled: result.rows[0].two_factor_enabled || false,
        bio: result.rows[0].bio || '',
        preferences: {
          notifications: {
            email: result.rows[0].notification_email !== false,
            push: result.rows[0].notification_push !== false,
            marketing: result.rows[0].notification_marketing || false
          },
          editor: {
            autoSave: result.rows[0].editor_auto_save !== false,
            showWordCount: result.rows[0].editor_word_count !== false,
            defaultCategory: result.rows[0].editor_default_category || 'Personal'
          },
          privacy: {
            showEmail: result.rows[0].privacy_show_email !== false,
            allowSearch: result.rows[0].privacy_allow_search !== false
          },
          appearance: {
            fontSize: result.rows[0].font_size || 'medium'
          }
        }
      } 
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    logger.error('Get profile error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Logout user
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

// Update user profile (UPDATED with bio and timezone)
export const updateProfile = async (req, res) => {
  try {
    const { name, email, theme, bio, timezone } = req.body;
    const userId = req.user.id;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email.toLowerCase());
    }
    if (theme !== undefined) {
      updates.push(`theme = $${paramCount++}`);
      values.push(theme);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (timezone !== undefined) {
      updates.push(`timezone = $${paramCount++}`);
      values.push(timezone);
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
      RETURNING id, name, email, created_at, theme, avatar, is_verified, timezone, two_factor_enabled, bio
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
        timezone: result.rows[0].timezone || 'Pacific Standard Time (PST)',
        twoFactorEnabled: result.rows[0].two_factor_enabled || false,
        bio: result.rows[0].bio || ''
      } 
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    logger.error('Update profile error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Change password
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

// Upload avatar
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

// Verify token
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

// ============================================
// PROFILE & SETTINGS FUNCTIONS
// ============================================

// ✅ Delete account permanently
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name;
    
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    
    logUserActivity(userName, userEmail, 'ACCOUNT_DELETED', 'Account permanently deleted');
    logger.info(`User account deleted: ${userEmail}`);
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    logger.error('Delete account error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update timezone
export const updateTimezone = async (req, res) => {
  try {
    const { timezone } = req.body;
    const userId = req.user.id;
    
    if (!timezone) {
      return res.status(400).json({ message: 'Timezone is required' });
    }
    
    await pool.query(
      'UPDATE users SET timezone = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [timezone, userId]
    );
    
    logger.info(`Timezone updated for user: ${req.user.email}`);
    res.json({ success: true, message: 'Timezone updated successfully', timezone });
  } catch (error) {
    console.error('❌ Update timezone error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Toggle Two-Factor Authentication
export const toggleTwoFactor = async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.user.id;
    
    await pool.query(
      'UPDATE users SET two_factor_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [enabled, userId]
    );
    
    logger.info(`Two-factor auth ${enabled ? 'enabled' : 'disabled'} for: ${req.user.email}`);
    res.json({ success: true, message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}` });
  } catch (error) {
    console.error('❌ Toggle two-factor error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get active sessions
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT last_login, updated_at FROM users WHERE id = $1',
      [userId]
    );
    
    const sessions = [];
    
    sessions.push({
      device: 'Current Device',
      browser: 'This browser',
      lastActive: result.rows[0].updated_at || new Date().toISOString(),
      isCurrent: true,
      location: 'Current Location'
    });
    
    if (result.rows[0].last_login) {
      sessions.push({
        device: 'Mobile App',
        browser: 'Unknown',
        lastActive: result.rows[0].last_login,
        isCurrent: false,
        location: 'Unknown'
      });
    }
    
    res.json({ success: true, sessions, count: sessions.length });
  } catch (error) {
    console.error('❌ Get active sessions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get user stats for dashboard
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const notesResult = await pool.query(
      'SELECT COUNT(*) as total FROM notes WHERE user_id = $1 AND is_deleted = false',
      [userId]
    );
    
    const favoritesResult = await pool.query(
      'SELECT COUNT(*) as favorites FROM notes WHERE user_id = $1 AND is_favorite = true AND is_deleted = false',
      [userId]
    );
    
    const pinnedResult = await pool.query(
      'SELECT COUNT(*) as pinned FROM notes WHERE user_id = $1 AND is_pinned = true AND is_deleted = false',
      [userId]
    );
    
    const archivedResult = await pool.query(
      'SELECT COUNT(*) as archived FROM notes WHERE user_id = $1 AND is_archived = true AND is_deleted = false',
      [userId]
    );
    
    const trashResult = await pool.query(
      'SELECT COUNT(*) as trash FROM notes WHERE user_id = $1 AND is_deleted = true',
      [userId]
    );
    
    const todayResult = await pool.query(
      "SELECT COUNT(*) as today FROM notes WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE AND is_deleted = false",
      [userId]
    );
    
    res.json({
      success: true,
      stats: {
        totalNotes: parseInt(notesResult.rows[0].total),
        favorites: parseInt(favoritesResult.rows[0].favorites),
        pinned: parseInt(pinnedResult.rows[0].pinned),
        archived: parseInt(archivedResult.rows[0].archived),
        trash: parseInt(trashResult.rows[0].trash),
        notesToday: parseInt(todayResult.rows[0].today),
        folders: 5
      }
    });
  } catch (error) {
    console.error('❌ Get user stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// USER PREFERENCES & SETTINGS FUNCTIONS
// ============================================

// ✅ Get all user preferences
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        notification_email, notification_push, notification_marketing,
        editor_auto_save, editor_word_count, editor_default_category,
        privacy_show_email, privacy_allow_search,
        font_size, theme, timezone
       FROM users 
       WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const prefs = result.rows[0];
    
    res.json({
      success: true,
      preferences: {
        notifications: {
          email: prefs.notification_email !== false,
          push: prefs.notification_push !== false,
          marketing: prefs.notification_marketing || false
        },
        editor: {
          autoSave: prefs.editor_auto_save !== false,
          showWordCount: prefs.editor_word_count !== false,
          defaultCategory: prefs.editor_default_category || 'Personal'
        },
        privacy: {
          showEmail: prefs.privacy_show_email !== false,
          allowSearch: prefs.privacy_allow_search !== false
        },
        appearance: {
          theme: prefs.theme || 'light',
          fontSize: prefs.font_size || 'medium',
          timezone: prefs.timezone || 'Pacific Standard Time (PST)'
        }
      }
    });
  } catch (error) {
    console.error('❌ Get user preferences error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update notification settings
export const updateNotifications = async (req, res) => {
  try {
    const { email, push, marketing } = req.body;
    const userId = req.user.id;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (email !== undefined) {
      updates.push(`notification_email = $${paramCount++}`);
      values.push(email);
    }
    if (push !== undefined) {
      updates.push(`notification_push = $${paramCount++}`);
      values.push(push);
    }
    if (marketing !== undefined) {
      updates.push(`notification_marketing = $${paramCount++}`);
      values.push(marketing);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(userId);
    
    await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
      values
    );
    
    logger.info(`Notification settings updated for user: ${req.user.email}`);
    res.json({ success: true, message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('❌ Update notifications error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update editor preferences
export const updateEditorPreferences = async (req, res) => {
  try {
    const { autoSave, showWordCount, defaultCategory } = req.body;
    const userId = req.user.id;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (autoSave !== undefined) {
      updates.push(`editor_auto_save = $${paramCount++}`);
      values.push(autoSave);
    }
    if (showWordCount !== undefined) {
      updates.push(`editor_word_count = $${paramCount++}`);
      values.push(showWordCount);
    }
    if (defaultCategory !== undefined) {
      updates.push(`editor_default_category = $${paramCount++}`);
      values.push(defaultCategory);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(userId);
    
    await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
      values
    );
    
    logger.info(`Editor preferences updated for user: ${req.user.email}`);
    res.json({ success: true, message: 'Editor preferences updated successfully' });
  } catch (error) {
    console.error('❌ Update editor preferences error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update privacy settings
export const updatePrivacySettings = async (req, res) => {
  try {
    const { showEmail, allowSearch } = req.body;
    const userId = req.user.id;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (showEmail !== undefined) {
      updates.push(`privacy_show_email = $${paramCount++}`);
      values.push(showEmail);
    }
    if (allowSearch !== undefined) {
      updates.push(`privacy_allow_search = $${paramCount++}`);
      values.push(allowSearch);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(userId);
    
    await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
      values
    );
    
    logger.info(`Privacy settings updated for user: ${req.user.email}`);
    res.json({ success: true, message: 'Privacy settings updated successfully' });
  } catch (error) {
    console.error('❌ Update privacy settings error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update font size
export const updateFontSize = async (req, res) => {
  try {
    const { fontSize } = req.body;
    const userId = req.user.id;
    
    if (!fontSize || !['small', 'medium', 'large'].includes(fontSize)) {
      return res.status(400).json({ message: 'Invalid font size' });
    }
    
    await pool.query(
      'UPDATE users SET font_size = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [fontSize, userId]
    );
    
    logger.info(`Font size updated for user: ${req.user.email}`);
    res.json({ success: true, message: 'Font size updated successfully', fontSize });
  } catch (error) {
    console.error('❌ Update font size error:', error);
    res.status(500).json({ message: error.message });
  }
};