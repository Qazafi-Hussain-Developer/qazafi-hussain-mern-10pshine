// frontend/src/pages/VerifyOTP/VerifyOTP.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './VerifyOTP.css'

const VerifyOTP = () => {
  const navigate = useNavigate()
  const { verifyOTP, resendOTP, loading: authLoading } = useAuth()
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds

  useEffect(() => {
    // Get email from localStorage
    const tempEmail = localStorage.getItem('tempEmail')
    if (!tempEmail) {
      navigate('/signup')
      return
    }
    setEmail(tempEmail)
  }, [navigate])

  // Timer for OTP expiry
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

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
      const nextInput = document.getElementById(`otp-input-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`)
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
    
    setLoading(true)
    const result = await verifyOTP(email, otpCode)
    setLoading(false)
    
    if (result.success) {
      setSuccess('Email verified successfully! Redirecting...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } else {
      setError(result.message || 'Invalid or expired OTP')
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    
    setError('')
    setSuccess('')
    setLoading(true)
    
    const result = await resendOTP(email)
    setLoading(false)
    
    if (result.success) {
      setSuccess('New verification code sent to your email')
      setResendCooldown(60) // 60 seconds cooldown
      setTimeLeft(600) // Reset timer to 10 minutes
      setOtp(['', '', '', '', '', ''])
      // Focus first input
      document.getElementById('otp-input-0')?.focus()
    } else {
      setError(result.message || 'Failed to resend OTP')
    }
  }

  return (
    <div className="verify-otp-container">
      <div className="ambient-glow"></div>
      
      <main className="verify-otp-main">
        <div className="verify-otp-card">
          <div className="verify-otp-header">
            <div className="logo-icon">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <h1 className="verify-otp-title">Verify Your Email</h1>
            <p className="verify-otp-subtitle">
              We've sent a verification code to<br />
              <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="verify-otp-form">
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
                  id={`otp-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input"
                  disabled={loading || authLoading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button 
              type="submit" 
              className="verify-button"
              disabled={loading || authLoading}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
              <span className="material-symbols-outlined">check_circle</span>
            </button>
          </form>

          <div className="resend-section">
            <p className="resend-text">
              Didn't receive the code?
              <button
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || loading}
                className={`resend-button ${resendCooldown > 0 ? 'disabled' : ''}`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
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

export default VerifyOTP