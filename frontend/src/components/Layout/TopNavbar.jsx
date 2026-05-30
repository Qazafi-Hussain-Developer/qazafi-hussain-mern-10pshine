import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './TopNavbar.css'

const TopNavbar = ({ onSearch }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [hasNotifications, setHasNotifications] = useState(false)
  const searchInputRef = useRef(null)

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
    if (onSearch) {
      onSearch(e.target.value)
    }
  }

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Get avatar URL from user context
  const avatarUrl = user?.avatar || null
  const userInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'
  const userName = user?.name || user?.email?.split('@')[0] || 'User'

  return (
    <header className="top-navbar">
      <div className="search-container">
        <span className="material-symbols-outlined search-icon">search</span>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search notes, tags, or content..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
        <div className="search-shortcut">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Optional: Greeting */}
        <div className="greeting-text">
          <span>Hello,</span>
          <span>{userName.split(' ')[0]}</span>
        </div>

        <div className="nav-divider"></div>

        {/* Notifications Button */}
        <button 
          className={`icon-btn ${hasNotifications ? 'notification-active' : ''}`} 
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
          {hasNotifications && <span className="notification-badge">3</span>}
        </button>

        {/* Settings Button */}
        <button 
          className="icon-btn" 
          onClick={() => navigate('/settings')}
          aria-label="Settings"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>

        {/* Profile Avatar */}
        <div 
          className="profile-avatar" 
          onClick={() => navigate('/profile')}
          role="button"
          tabIndex={0}
          aria-label="Profile"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={`${userName}'s profile`} className="avatar-image" />
          ) : (
            <div className="avatar-initial">
              {userInitial}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default TopNavbar