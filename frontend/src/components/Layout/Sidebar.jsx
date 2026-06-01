import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, logout } = useAuth()

  // State for dynamic data
  const [notebooks, setNotebooks] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI state for Notebook (now with icon + color from folder)
  const [showAddNotebook, setShowAddNotebook] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [newNotebookIcon, setNewNotebookIcon] = useState('📓')
  const [newNotebookColor, setNewNotebookColor] = useState('#a78bfa')
  
  // Tag state
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  // Icon options for notebook (beautiful emoji icons)
  const NOTEBOOK_ICONS = ['📓', '📘', '💡', '🚀', '🎨', '📝', '🔖', '⭐', '❤️', '🔥', '🌈', '🎵', '📷', '🍀', '🌟', '🏠', '💼', '🎓', '🏃', '💰', '✈️', '📚', '🎄', '💭']

  // Color options with visual circles like in your image
  const COLOR_OPTIONS = [
    { name: 'Green', value: '#10b981', emoji: '🟢' },
    { name: 'Blue', value: '#3b82f6', emoji: '🔵' },
    { name: 'Purple', value: '#a78bfa', emoji: '🟣' },
    { name: 'Yellow', value: '#f59e0b', emoji: '🟡' },
    { name: 'Red', value: '#ef4444', emoji: '🔴' },
    { name: 'Pink', value: '#ec4899', emoji: '💗' },
    { name: 'Orange', value: '#f97316', emoji: '🟠' },
    { name: 'Cyan', value: '#06b6d4', emoji: '💙' },
    { name: 'White', value: '#ffffff', emoji: '⚪' },
    { name: 'Gray', value: '#6b7280', emoji: '⚫' },
  ]

  // Fetch all sidebar data from backend
  useEffect(() => {
    if (token) {
      fetchSidebarData()
    }
  }, [token])

  const fetchSidebarData = async () => {
    try {
      setLoading(true)
      
      // Fetch notebooks (categories) - now supports custom icons and colors
      const notebooksRes = await fetch('http://localhost:5000/api/notes/notebooks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const notebooksData = await notebooksRes.json()
      if (notebooksData.success) {
        setNotebooks(notebooksData.notebooks.map(item => ({
          id: item.id,
          name: item.category || item.name,
          count: item.count,
          icon: item.icon || getCategoryIcon(item.category || item.name),
          color: item.color || '#a78bfa'
        })))
      }

      // Fetch tags
      const tagsRes = await fetch('http://localhost:5000/api/notes/tags', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const tagsData = await tagsRes.json()
      if (tagsData.success) {
        setTags(tagsData.tags)
      }
    } catch (error) {
      console.error('Error fetching sidebar data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get icon based on category name (fallback for old notebooks)
  const getCategoryIcon = (category) => {
    const icons = {
      'Personal': '📝',
      'Work': '💼',
      'Ideas': '💡',
      'Journal': '📓',
      'Health': '🏃',
      'Finance': '💰',
      'Travel': '✈️',
      'Education': '📚',
      'Shopping': '🛒',
      'Recipes': '🍳',
      'Projects': '📊'
    }
    return icons[category] || '📔'
  }

  // Add new notebook (now with icon + color - merged from folder)
  const handleAddNotebook = async () => {
    if (!newNotebookName.trim()) return
    
    try {
      const response = await fetch('http://localhost:5000/api/notes/notebooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newNotebookName.trim(),
          icon: newNotebookIcon,
          color: newNotebookColor
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setNewNotebookName('')
        setNewNotebookIcon('📓')
        setNewNotebookColor('#a78bfa')
        setShowAddNotebook(false)
        await fetchSidebarData()
      }
    } catch (error) {
      console.error('Error creating notebook:', error)
    }
  }

  // Delete notebook
  const handleDeleteNotebook = async (notebookId, notebookName) => {
    if (window.confirm(`Are you sure you want to delete "${notebookName}"? Notes will be moved to uncategorized.`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/notes/notebooks/${notebookId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const data = await response.json()
        if (data.success) {
          await fetchSidebarData()
        }
      } catch (error) {
        console.error('Error deleting notebook:', error)
      }
    }
  }

  // Add new tag
  const handleAddTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      const response = await fetch('http://localhost:5000/api/notes/tags', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tag: newTagName.trim() })
      })
      
      if (response.ok) {
        setNewTagName('')
        setShowAddTag(false)
        await fetchSidebarData()
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout()
      navigate('/login')
    }
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard'
    }
    if (path.startsWith('/notebook/')) {
      return location.pathname === path
    }
    if (path.startsWith('/tag/')) {
      return location.pathname === path
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

      {/* NOTEBOOKS SECTION - MERGED WITH FOLDER OPTIONS (ICON + COLOR) */}
      {/* FOLDERS SECTION REMOVED - All folder functionality merged into notebooks */}
      <div className="sidebar-section">
        <div className="section-header">
          <h3>📓 Notebooks</h3>
          <button className="add-notebook-btn" onClick={() => setShowAddNotebook(!showAddNotebook)}>
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        
        {/* ADD NOTEBOOK PANEL - WITH ICON + COLOR PICKER (MERGED FROM FOLDER) */}
        {showAddNotebook && (
          <div className="add-notebook-panel">
            <input
              type="text"
              placeholder="Notebook name"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              className="notebook-name-input"
              onKeyPress={(e) => e.key === 'Enter' && handleAddNotebook()}
              autoFocus
            />
            
            {/* Icon Selector - Beautiful emoji grid */}
            <div className="notebook-icon-selector">
              <label>Icon:</label>
              <div className="icon-preview-row">
                <span className="selected-icon-preview" style={{ backgroundColor: `${newNotebookColor}20` }}>
                  {newNotebookIcon}
                </span>
                <select value={newNotebookIcon} onChange={(e) => setNewNotebookIcon(e.target.value)}>
                  {NOTEBOOK_ICONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Color Picker - Visual color circles like 🟢 🟢 🟢 🟡 */}
            <div className="notebook-color-selector">
              <label>Color:</label>
              <div className="color-options-grid">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color.value}
                    className={`color-option-btn ${newNotebookColor === color.value ? 'active' : ''}`}
                    style={{ 
                      backgroundColor: color.value,
                      border: color.value === '#ffffff' ? '1px solid #ddd' : 'none'
                    }}
                    onClick={() => setNewNotebookColor(color.value)}
                    title={color.name}
                  >
                    {newNotebookColor === color.value && color.emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="notebook-actions">
              <button onClick={() => setShowAddNotebook(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleAddNotebook} className="create-btn">Create Notebook</button>
            </div>
          </div>
        )}
        
        {/* NOTEBOOKS LIST - Now with color accents on each notebook */}
        <div className="notebooks-list">
          {loading ? (
            <div className="loading-text">Loading notebooks...</div>
          ) : (
            notebooks.map((notebook) => (
              <div key={notebook.id || notebook.name} className="notebook-item-wrapper">
                <Link 
                  to={`/notebook/${encodeURIComponent(notebook.name)}`}
                  className={`notebook-link ${isActive(`/notebook/${encodeURIComponent(notebook.name)}`) ? 'active' : ''}`}
                  style={{
                    borderLeftColor: notebook.color,
                    borderLeftWidth: '3px',
                    borderLeftStyle: 'solid'
                  }}
                >
                  <span className="notebook-icon">{notebook.icon}</span>
                  <span className="notebook-name">{notebook.name}</span>
                  <span className="notebook-count" style={{ backgroundColor: `${notebook.color}20`, color: notebook.color }}>
                    {notebook.count}
                  </span>
                </Link>
                <button 
                  className="delete-notebook-btn"
                  onClick={() => handleDeleteNotebook(notebook.id, notebook.name)}
                  title="Delete notebook"
                >
                  <span className="material-symbols-outlined">delete_outline</span>
                </button>
              </div>
            ))
          )}
          {!loading && notebooks.length === 0 && (
            <div className="empty-message">
              <span className="material-symbols-outlined">create_new_folder</span>
              <p>No notebooks yet.</p>
              <small>Click + to create one with custom icon & color!</small>
            </div>
          )}
        </div>
      </div>

      {/* Tags Section with Add Button */}
      <div className="sidebar-section">
        <div className="section-header">
          <h3>🏷️ Tags</h3>
          <button className="add-tag-btn" onClick={() => setShowAddTag(!showAddTag)}>
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        
        {showAddTag && (
          <div className="add-tag-input">
            <input
              type="text"
              placeholder="New tag name..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              autoFocus
            />
            <button onClick={handleAddTag}>Add</button>
          </div>
        )}
        
        <div className="tags-list">
          {loading ? (
            <div className="loading-text">Loading tags...</div>
          ) : (
            tags.map((tag) => (
              <Link 
                key={tag.tag} 
                to={`/tag/${encodeURIComponent(tag.tag)}`}
                className={`tag-link ${isActive(`/tag/${encodeURIComponent(tag.tag)}`) ? 'active' : ''}`}
              >
                <span className="tag-hash">#</span>
                <span className="tag-name">{tag.tag}</span>
                <span className="tag-count">{tag.count}</span>
              </Link>
            ))
          )}
          {!loading && tags.length === 0 && (
            <div className="empty-message">
              <span className="material-symbols-outlined">sell</span>
              <p>No tags yet.</p>
              <small>Click + to add tags to your notes!</small>
            </div>
          )}
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