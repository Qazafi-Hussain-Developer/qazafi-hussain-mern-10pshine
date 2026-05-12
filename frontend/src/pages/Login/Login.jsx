import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Mock authentication - Replace with actual API call
    if (formData.email && formData.password) {
      localStorage.setItem('token', 'mock-token')
      localStorage.setItem('user', JSON.stringify({ 
        name: 'Julian',
        email: formData.email 
      }))
      navigate('/')
    } else {
      setError('Please enter email and password')
    }
  }

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`)
    // Implement social login
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

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}
            
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
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-link">Forgot?</a>
              </div>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="signin-button">
              Sign In
              <span className="material-symbols-outlined">login</span>
            </button>
          </form>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <div className="social-buttons">
            <button onClick={() => handleSocialLogin('Google')} className="social-btn">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvDPTjxzOEqlEnHNr3Zz3Trt_nRgwU52LlQ875lHfSCsnjwaxKUdV6TI8cYiwppwZgai2ZGreYiZ7w8ILh73Qe8w1odoF1kyDSyuOmPom7MBAZ_TFO131PNRyD5mbjubdCrICCKYxAX4czytePd5kJwN15FbSV0p3DZIq-McmcOKBXNZJ_kzEbmcegxBh4umessvRKRPockxtT8wBqvft7oqC1IYOad177zsfVYj7qpbDbbqbKabVs2hqdOxgLHbGxk0624PrOm98" alt="Google" />
              Google
            </button>
            <button onClick={() => handleSocialLogin('Apple')} className="social-btn">
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