import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Notebooks state (renamed from folders)
  const [notebooks, setNotebooks] = useState([
    { name: 'Personal', count: 12, icon: '📝' },
    { name: 'Work', count: 8, icon: '💼' },
    { name: 'Ideas', count: 5, icon: '💡' },
    { name: 'Journal', count: 3, icon: '📓' },
  ])
  const [showAddNotebook, setShowAddNotebook] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')

  // Tags state with # symbol display
  const [tags] = useState([
    { name: 'urgent', count: 3 },
    { name: 'todo', count: 7 },
    { name: 'important', count: 5 },
    { name: 'waiting', count: 2 },
  ])

  // Add notebook function
  const handleAddNotebook = () => {
    if (newNotebookName.trim()) {
      setNotebooks([...notebooks, { name: newNotebookName, count: 0, icon: '📔' }])
      setNewNotebookName('')
      setShowAddNotebook(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
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

      <button className="create-note-btn" onClick={() => navigate('/editor/new')}>
        <span className="material-symbols-outlined">add</span>
        Create New Note
      </button>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </Link>
        <Link to="/notes" className={`nav-link ${isActive('/notes') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">description</span>
          All Notes
        </Link>
        <Link to="/favorites" className={`nav-link ${isActive('/favorites') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">star</span>
          Favorites
        </Link>
        <Link to="/categories" className={`nav-link ${isActive('/categories') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">category</span>
          Categories
        </Link>
        <Link to="/archive" className={`nav-link ${isActive('/archive') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">archive</span>
          Archive
        </Link>
        <Link to="/trash" className={`nav-link ${isActive('/trash') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">delete</span>
          Trash
        </Link>
      </nav>

      {/* Notebooks Section (replacing Folders) */}
      <div className="sidebar-section">
        <div className="section-header">
          <h3>Notebooks</h3>
          <button className="add-folder-btn" onClick={() => setShowAddNotebook(!showAddNotebook)}>
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        
        {showAddNotebook && (
          <div className="add-folder-input">
            <input
              type="text"
              placeholder="Notebook name"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddNotebook()}
              autoFocus
            />
          </div>
        )}
        
        <div className="notebooks-list">
          {notebooks.map((notebook) => (
            <Link 
              key={notebook.name} 
              to={`/notebook/${notebook.name}`}
              className="notebook-link"
            >
              <span className="notebook-icon">{notebook.icon}</span>
              <span className="notebook-name">{notebook.name}</span>
              <span className="notebook-count">{notebook.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tags Section with # symbol */}
      <div className="sidebar-section">
        <div className="section-header">
          <h3>Tags</h3>
        </div>
        <div className="tags-list">
          {tags.map((tag) => (
            <Link 
              key={tag.name} 
              to={`/tag/${tag.name}`}
              className="tag-link"
            >
              <span className="tag-hash">#</span>
              <span className="tag-name">{tag.name}</span>
              <span className="tag-count">{tag.count}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="sidebar-divider"></div>

      <nav className="sidebar-nav secondary-nav">
        <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">person</span>
          Profile
        </Link>
        <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">settings</span>
          Settings
        </Link>
        <Link to="/help" className={`nav-link ${isActive('/help') ? 'active' : ''}`}>
          <span className="material-symbols-outlined">help</span>
          Help & Support
        </Link>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="nav-link logout-btn">
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
        <div className="sidebar-version">
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar