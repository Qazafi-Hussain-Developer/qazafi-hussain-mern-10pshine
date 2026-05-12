import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './TopNavbar.css'

const TopNavbar = ({ onSearch }) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
    if (onSearch) {
      onSearch(e.target.value)
    }
  }

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
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAD7bMaZsJJD_R-EaWI5KVwQqV_L5y9GEKbTxOJiD-DUr5izKxioj1cWBQvGxzlbCUue94ukVAzKha0NDIYDafGyiT2zXRtcg3Cgb_wZYvguCzs6Zu_-4Xqfm2r5GkbY1jIH4gdbls1NptL8i1kQbGk-qqAXmUQpbv0t8p1OKKLoPwDvugmIzc3tpzZcmrQd8MckqRIfAUSGEcTUB7bggzEU1AP-_Fmrw_GQxBaFMxOgFCaJo2nom7zWvzF8c63XGj4JGMZH4OG3D8"
            alt="Profile"
          />
        </div>
      </div>
    </header>
  )
}

export default TopNavbar