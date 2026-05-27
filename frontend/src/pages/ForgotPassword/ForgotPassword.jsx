// frontend/src/pages/ForgotPassword/ForgotPassword.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './ForgotPassword.css'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()
  
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!email) {
      setError('Please enter your email address')
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    setLoading(true)
    const result = await forgotPassword(email)
    setLoading(false)
    
    if (result.success) {
      setSuccess('Password reset OTP sent to your email!')
      // Store email for reset password page
      localStorage.setItem('resetEmail', email)
      // Redirect to reset password page after 2 seconds
      setTimeout(() => {
        navigate('/reset-password')
      }, 2000)
    } else {
      setError(result.message || 'Failed to send reset OTP')
    }
  }

  return (
    <div className="forgot-password-container">
      <div className="ambient-glow"></div>
      
      <main className="forgot-password-main">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <div className="logo-icon">
              <span className="material-symbols-outlined">lock_reset</span>
            </div>
            <h1 className="forgot-password-title">Forgot Password?</h1>
            <p className="forgot-password-subtitle">
              No worries! Enter your email address and we'll send you a verification code to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="forgot-password-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="send-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>

          <div className="back-to-login">
            <Link to="/login">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Login
            </Link>
          </div>
        </div>

        <div className="help-text">
          <p>
            <span className="material-symbols-outlined">info</span>
            We'll send a 6-digit verification code to your email. The code expires in 10 minutes.
          </p>
        </div>
      </main>
    </div>
  )
}

export default ForgotPassword
