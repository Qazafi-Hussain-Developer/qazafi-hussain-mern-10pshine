// backend/src/utils/generateOTP.js

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
const generateOTP = () => {
  // Generate random number between 100000 and 999999
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

/**
 * Generate OTP with expiration time
 * @param {number} minutes - Minutes until expiration (default: 10)
 * @returns {object} { otp, expiresAt }
 */
const generateOTPWithExpiry = (minutes = 10) => {
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  
  return {
    otp,
    expiresAt,
  };
};

export { generateOTP, generateOTPWithExpiry };
export default generateOTP;