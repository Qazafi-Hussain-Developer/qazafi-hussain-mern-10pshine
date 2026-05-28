// src/pages/NotFound/NotFound.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './NotFound.css'

const NotFound = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const goBack = () => {
    navigate(-1)
  }

  const goHome = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login')
  }

  return (
    <div className="not-found-container">
      <div className="ambient-glow"></div>
      
      <main className="not-found-main">
        <div className="not-found-card">
          <div className="not-found-icon">
            <span className="material-symbols-outlined">error</span>
          </div>
          
          <h1 className="not-found-code">404</h1>
          <h2 className="not-found-title">Page Not Found</h2>
          
          <p className="not-found-message">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="not-found-actions">
            <button onClick={goBack} className="btn-secondary">
              <span className="material-symbols-outlined">arrow_back</span>
              Go Back
            </button>
            <button onClick={goHome} className="btn-primary">
              <span className="material-symbols-outlined">home</span>
              Go Home
            </button>
          </div>
          
          <div className="not-found-links">
            <Link to="/login">Login</Link>
            <span className="separator">•</span>
            <Link to="/signup">Sign Up</Link>
            <span className="separator">•</span>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </div>
        
        <footer className="not-found-footer">
          <p>Lavender Notes - Your digital zen workspace</p>
        </footer>
      </main>
    </div>
  )
}

export default NotFound