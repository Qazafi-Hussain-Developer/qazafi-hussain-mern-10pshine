// src/pages/Login/Login.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const { loginWithCredentials, login } = useAuth() // ✅ Added loginWithCredentials, kept existing login
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [rememberMe, setRememberMe] = useState(false) // ✅ NEW: Remember Me state
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please enter email and password')
      setLoading(false)
      return
    }

    try {
      console.log('Sending login request for:', formData.email)
      
      // ✅ Updated to use the new auth method with remember me
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()
      console.log('Response status:', response.status)
      console.log('Response data:', data)

      if (response.ok && data.success) {
        // ✅ Pass rememberMe to the login function
        login(data.user, data.token, rememberMe)
        navigate('/dashboard')
      } else {
        setError(data.message || 'Invalid email or password')
      }
    } catch (err) {
      console.error('Login error details:', err)
      setError('Unable to connect to server. Please make sure the backend is running on port 5000.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ NEW: Handle social login - will redirect to backend OAuth
  const handleSocialLogin = (provider) => {
    // Redirect to backend OAuth route
    window.location.href = `http://localhost:5000/api/auth/${provider.toLowerCase()}`
  }

  return (
    <div className="login-container">
      <div className="ambient-glow"></div>
      
      <main className="login-main">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-icon">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
            <h1 className="login-title">Lavender Notes</h1>
            <p className="login-subtitle">Return to your digital zen workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {error && <div className="error-message" data-testid="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                {/* ✅ Updated Forgot Password link to use React Router */}
                <Link to="/forgot-password" className="forgot-link">Forgot?</Link>
              </div>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* ✅ NEW: Remember Me checkbox */}
            <div className="form-group remember-me-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkbox-text">Remember me</span>
              </label>
            </div>

            <button type="submit" className="signin-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
              <span className="material-symbols-outlined">login</span>
            </button>
          </form>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <div className="social-buttons">
            <button onClick={() => handleSocialLogin('Google')} className="social-btn" type="button" disabled={loading}>
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvDPTjxzOEqlEnHNr3Zz3Trt_nRgwU52LlQ875lHfSCsnjwaxKUdV6TI8cYiwppwZgai2ZGreYiZ7w8ILh73Qe8w1odoF1kyDSyuOmPom7MBAZ_TFO131PNRyD5mbjubdCrICCKYxAX4czytePd5kJwN15FbSV0p3DZIq-McmcOKBXNZJ_kzEbmcegxBh4umessvRKRPockxtT8wBqvft7oqC1IYOad177zsfVYj7qpbDbbqbKabVs2hqdOxgLHbGxk0624PrOm98" 
                alt="Google" 
              />
              Google
            </button>
            <button onClick={() => handleSocialLogin('Apple')} className="social-btn" type="button" disabled={loading}>
              <span className="material-symbols-outlined">ios</span>
              Apple
            </button>
          </div>

          <div className="signup-link">
            <p>New to Lavender Notes? <Link to="/signup">Create an account</Link></p>
          </div>
        </div>

        <footer className="login-footer">
          <a href="#">Privacy Policy</a>
          <span>•</span>
          <a href="#">Terms of Service</a>
        </footer>
      </main>

      <div className="side-graphic">
        <div className="side-card">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsYHc42-Y6qBYY-k35II0RPmO_JHaGrXvnphMhhcT3JY1WCm6mmlYlLiQyokwaBoiMSGezqyQ3Hq-WQOynE0cgSWfScCAOPZsbwcOJE-UKFexQ-gGutx7sA5nr6ci5mpOuG6Hk_wVykPBsJ3OI7Oyedh7UDycEgWYfBN-rdKKbg-YpXB9CwZ-Arr91CLprsDTFid62RTNB9nSSxsIrpkysyAZ5tS_4XAYrSAWfdskpRwTkCbAwjG__-aRaKuQLoZsx3WmjGgPmXDA" 
            alt="Peaceful workspace"
            className="side-image"
          />
          <div className="side-overlay">
            <h3>Effortless Clarity</h3>
            <p>Organize your creative thoughts in an environment designed for deep focus and high performance.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login