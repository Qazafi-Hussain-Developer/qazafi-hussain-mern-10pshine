import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import generateToken from '../utils/generateToken.js';
import logger, { logUserActivity } from '../utils/logger.js';

// Register user
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

    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at`,
      [name, email.toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    logUserActivity(name, email, 'ACCOUNT_CREATED', 'User registered successfully');
    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        theme: 'light',
        avatar: null,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Register error details:', error);
    logger.error('Register error:', error.message);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email, passwordProvided: !!password });
    console.log('📦 Full request body:', req.body);

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const result = await pool.query('SELECT id, name, email, password, created_at, avatar FROM users WHERE email = $1', [email.toLowerCase()]);

    console.log('👤 User found:', result.rows.length > 0 ? 'Yes' : 'No');

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
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
      },
      token,
    });
  } catch (error) {
    console.error('❌ Login error details:', error);
    logger.error('Login error:', error.message);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at, avatar, theme FROM users WHERE id = $1',
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
        avatar: result.rows[0].avatar || null
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

// Update user profile
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
      RETURNING id, name, email, created_at, theme, avatar
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
        avatar: result.rows[0].avatar || null
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