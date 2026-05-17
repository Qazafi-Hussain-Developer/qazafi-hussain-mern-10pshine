import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './SignUp.css'

const SignUp = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      // Real API call to your backend
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Auto-login after successful registration
        login(data.user, data.token)
        // Redirect to dashboard
        navigate('/dashboard')
      } else {
        setError(data.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('Unable to connect to server. Please make sure the backend is running on port 5000.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignUp = async (provider) => {
    console.log(`Sign up with ${provider}`)
    // Social login can be implemented later
  }

  return (
    <div className="signup-container">
      <main className="signup-main">
        <div className="signup-card">
          <div className="signup-sidebar">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7Bv9UzDmZMWFCeAsiJ6bombqnfC0zD6pwK1g7LpQy4O7YeqidXKdt4nrgR-Pxg31vkQL883r8QbgQBJAilsdzaJIpob8TYQXCAIWQAjlMdi9ucgLEAo5yCg-yOVs8nFShHliDoz0VMh0Ljo8p96Zf-AnDWdVBaZz8k531JoGeNQAdDGuNga3FzRYe8gdRcFbegXS47gDOTgWxm6l9Lfrg0Z6S63jTy3vDmDMWL78MfmXGuifrD-VSYLLQEZThqBJllgzpurjpBBo"
              alt="Zen Workspace"
              className="sidebar-image"
            />
            <div className="sidebar-content">
              <h1>Lavender Notes</h1>
              <p>Find your digital zen. Organize your thoughts in a high-performance environment designed for clarity and focus.</p>
            </div>
            <div className="sidebar-overlay"></div>
          </div>

          <div className="signup-form-container">
            <div className="signup-form-wrapper">
              <header className="signup-header">
                <div className="header-logo">
                  <span className="material-symbols-outlined">edit_note</span>
                  <span>Lavender Notes</span>
                </div>
                <h2>Create Account</h2>
                <p>Start your journey to organized thought.</p>
              </header>

              <form onSubmit={handleSubmit} className="signup-form">
                {error && <div className="error-message">{error}</div>}
                
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">person</span>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Enter your name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">mail</span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">lock</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Create a password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      required
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
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button type="submit" className="create-button" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>

              <div className="divider">
                <span>or sign up with</span>
              </div>

              <div className="social-buttons">
                <button onClick={() => handleSocialSignUp('Google')} className="social-btn" disabled={loading}>
                  <svg className="social-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878757,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                    <path fill="#34A853" d="M5.26620003,9.76452941 C3.22782177,12.0182951 3.22782177,15.0983862 5.26620003,17.3521519 L5.26620003,9.76452941 Z" transform="translate(0, 0.5)"/>
                    <path fill="#4A90E2" d="M12,22.7272727 C14.3636364,22.7272727 16.5272727,21.7090909 18.2181818,20.2 C15.8181818,18.2 15.8181818,18.2 12,20.2 C9.27272727,20.2 6.90909091,18.8181818 5.26620003,17.3521519 L1.23999023,20.4666494 C3.1977497,24.4017021 7.27006974,27.2727273 12,27.2727273 C16.7272727,27.2727273 20.8,24.4017021 22.8,20.4666494 C24.2,17.7 24.2,14.3 22.8,11.5 L12,11.5 L12,14.5 L12,22.7272727 Z"/>
                    <path fill="#FBBC05" d="M22.8,11.5 C23.6,13.5 23.6,16.5 22.8,18.5 C22.8,18.5 21.4,20.2 20.2,21.4 C20.2,21.4 21.8,20.2 22.8,20.4666494 C24.2,17.7 24.2,14.3 22.8,11.5 Z" transform="translate(0, -0.5)"/>
                  </svg>
                  Google
                </button>
                <button onClick={() => handleSocialSignUp('Apple')} className="social-btn" disabled={loading}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>ios</span>
                  Apple
                </button>
              </div>

              <footer className="signup-footer">
                <p>Already have an account? <Link to="/login">Sign in</Link></p>
              </footer>
            </div>
          </div>
        </div>

        <div className="terms-footer">
          <p>
            By creating an account, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </div>
  )
}

export default SignUp