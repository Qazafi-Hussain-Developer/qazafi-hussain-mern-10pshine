// backend/src/models/OTP.js
import pool from '../config/db.js';
import logger from '../utils/logger.js';

// Create OTP table if not exists
const initOTPTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS otps (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create index for faster lookups and auto-cleanup
    CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
    CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);
  `;
  
  try {
    await pool.query(query);
    logger.info('OTP table initialized');
  } catch (error) {
    logger.error('Error creating OTP table:', error.message);
  }
};

// Initialize table on import
initOTPTable();

// OTP Model methods
const OTP = {
  // Create a new OTP
  create: async ({ email, otp, purpose, expiresAt }) => {
    const query = `
      INSERT INTO otps (email, otp, purpose, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, otp, purpose, expires_at, created_at
    `;
    const values = [email.toLowerCase(), otp, purpose, expiresAt];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },
  
  // Find one OTP by conditions
  findOne: async ({ email, otp, purpose, expiresAt }) => {
    let query = 'SELECT * FROM otps WHERE email = $1';
    const values = [email.toLowerCase()];
    let paramCount = 2;
    
    if (otp) {
      query += ` AND otp = $${paramCount++}`;
      values.push(otp);
    }
    if (purpose) {
      query += ` AND purpose = $${paramCount++}`;
      values.push(purpose);
    }
    if (expiresAt) {
      query += ` AND expires_at > NOW()`;
    }
    
    query += ' ORDER BY id DESC LIMIT 1';
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },
  
  // Delete OTP by ID
  deleteOne: async (id) => {
    const query = 'DELETE FROM otps WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  },
  
  // Delete many OTPs by email and purpose
  deleteMany: async ({ email, purpose }) => {
    let query = 'DELETE FROM otps WHERE email = $1';
    const values = [email.toLowerCase()];
    
    if (purpose) {
      query += ` AND purpose = $2`;
      values.push(purpose);
    }
    
    const result = await pool.query(query, values);
    return result.rowCount;
  },
  
  // Delete expired OTPs (manual cleanup)
  deleteExpired: async () => {
    const query = 'DELETE FROM otps WHERE expires_at < NOW()';
    const result = await pool.query(query);
    return result.rowCount;
  },
};

export default OTP;