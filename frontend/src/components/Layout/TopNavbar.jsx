import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './TopNavbar.css'

const TopNavbar = ({ onSearch }) => {
  const navigate = useNavigate()
  const { user } = useAuth()  // ✅ Get user from AuthContext instead of localStorage
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
    if (onSearch) {
      onSearch(e.target.value)
    }
  }

  // Get avatar URL from user context
  const avatarUrl = user?.avatar || null
  const userInitial = user?.name?.charAt(0) || 'U'

  return (
    <header className="top-navbar">
      <div className="search-container">
        <span className="material-symbols-outlined search-icon">search</span>
        <input
          type="text"
          placeholder="Search notes, tags, or content..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="navbar-actions">
        <button className="icon-btn" onClick={() => navigate('/notifications')}>
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="icon-btn" onClick={() => navigate('/settings')}>
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="profile-avatar" onClick={() => navigate('/profile')}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="avatar-image" />
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