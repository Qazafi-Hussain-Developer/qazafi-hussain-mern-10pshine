import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
        </div>
        <div>
          <h1 className="logo-title">Lavender Notes</h1>
          <p className="logo-subtitle">Digital Zen</p>
        </div>
      </div>

      <button className="create-note-btn" onClick={() => navigate('/editor')}>
        <span className="material-symbols-outlined">add</span>
        Create New Note
      </button>

      <nav className="sidebar-nav">
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">description</span>
          All Notes
        </Link>
        <Link to="/favorites" className="nav-link">
          <span className="material-symbols-outlined">star</span>
          Favorites
        </Link>
        <Link to="/categories" className="nav-link">
          <span className="material-symbols-outlined">folder</span>
          Categories
        </Link>
        <Link to="/archive" className="nav-link">
          <span className="material-symbols-outlined">archive</span>
          Archive
        </Link>
      </nav>

      <div className="sidebar-footer">
        <Link to="/help" className="nav-link">
          <span className="material-symbols-outlined">help</span>
          Help
        </Link>
        <button onClick={handleLogout} className="nav-link logout-btn">
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar