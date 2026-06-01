// backend/src/utils/generateOTP.js

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
export const generateOTP = () => {
  // Generate random number between 100000 and 999999
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

/**
 * Generate OTP with expiration time
 * @param {number} minutes - Minutes until expiration (default: 10)
 * @returns {object} { otp, expiresAt }
 */
export const generateOTPWithExpiry = (minutes = 10) => {
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  
  return {
    otp,
    expiresAt,
  };
};

/**
 * Check if OTP is expired
 * @param {Date} expiresAt - Expiration timestamp
 * @returns {boolean} True if expired
 */
export const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Generate a random token for invitations or password reset
 * @param {number} length - Token length (default: 32)
 * @returns {string} Random token
 */
export const generateRandomToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Generate invitation token (shorter version for emails)
 * @returns {string} Invitation token
 */
export const generateInvitationToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Default export for backward compatibility
export default generateOTP;