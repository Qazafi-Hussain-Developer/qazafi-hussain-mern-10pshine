// frontend/src/pages/ResetPassword/ResetPassword.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './ResetPassword.css'

const ResetPassword = () => {
  const navigate = useNavigate()
  const { resetPassword } = useAuth()
  
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds

  useEffect(() => {
    // Get email from localStorage
    const resetEmail = localStorage.getItem('resetEmail')
    if (!resetEmail) {
      navigate('/forgot-password')
      return
    }
    setEmail(resetEmail)
  }, [navigate])

  // Timer for OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(0, 1)
    setOtp(newOtp)
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`reset-otp-input-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`reset-otp-input-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }
    
    if (!newPassword) {
      setError('Please enter a new password')
      return
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    const result = await resetPassword(email, otpCode, newPassword)
    setLoading(false)
    
    if (result.success) {
      setSuccess('Password reset successful! Redirecting to login...')
      // Clear stored email
      localStorage.removeItem('resetEmail')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } else {
      setError(result.message || 'Failed to reset password')
    }
  }

  const handleResendOTP = async () => {
    // This would call the forgotPassword endpoint again
    // For now, we'll just redirect to forgot password
    navigate('/forgot-password')
  }

  return (
    <div className="reset-password-container">
      <div className="ambient-glow"></div>
      
      <main className="reset-password-main">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <div className="logo-icon">
              <span className="material-symbols-outlined">password</span>
            </div>
            <h1 className="reset-password-title">Reset Password</h1>
            <p className="reset-password-subtitle">
              Enter the verification code sent to<br />
              <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="reset-password-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="otp-timer">
              <span className="material-symbols-outlined">schedule</span>
              <span>Code expires in: <strong>{formatTime(timeLeft)}</strong></span>
            </div>
            
            <div className="otp-input-group">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`reset-otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input"
                  disabled={loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <small className="password-hint">Password must be at least 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="reset-button"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
              <span className="material-symbols-outlined">check_circle</span>
            </button>
          </form>

          <div className="resend-section">
            <p className="resend-text">
              Didn't receive the code?
              <button
                onClick={handleResendOTP}
                className="resend-button"
              >
                Resend Code
              </button>
            </p>
          </div>

          <div className="back-to-login">
            <Link to="/login">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ResetPassword