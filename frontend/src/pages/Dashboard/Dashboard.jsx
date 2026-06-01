import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Layout/Sidebar'
import TopNavbar from '../../components/Layout/TopNavbar'
import NoteGrid from '../../components/Notes/NoteGrid'
import NoteList from '../../components/Notes/NoteList'
import { useAuth } from '../../context/AuthContext'
import './Dashboard.css'

// Category icons and colors
const categoryIcons = {
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

const categoryColors = {
  'Personal': '#a78bfa',
  'Work': '#3b82f6',
  'Ideas': '#f59e0b',
  'Journal': '#10b981',
  'Health': '#ef4444',
  'Finance': '#22c55e',
  'Travel': '#06b6d4',
  'Education': '#8b5cf6',
  'Shopping': '#ec4899',
  'Recipes': '#f97316',
  'Projects': '#6b7280'
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const location = useLocation()
  const [notes, setNotes] = useState([])
  const [filteredNotes, setFilteredNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('updated')
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    streak: 5,
    favorites: 0,
    pinned: 0,
    trash: 0
  })

  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [showFilterBar, setShowFilterBar] = useState(false)

  const debounceTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  const currentHour = new Date().getHours()
  let greeting = 'Good evening'
  if (currentHour < 12) {
    greeting = 'Good morning'
  } else if (currentHour < 18) {
    greeting = 'Good afternoon'
  }

  // Determine filter type from URL path
  useEffect(() => {
    const path = location.pathname
    
    if (path === '/favorites') {
      setActiveFilter('favorites')
    } else if (path === '/archive') {
      setActiveFilter('archive')
    } else if (path === '/categories') {
      setActiveFilter('categories')
    } else if (path.startsWith('/notebook/')) {
      setActiveFilter('notebook')
    } else if (path.startsWith('/folder/')) {
      setActiveFilter('folder')
    } else if (path.startsWith('/tag/')) {
      setActiveFilter('tag')
    } else {
      setActiveFilter('all')
    }
  }, [location.pathname])

  // Build API URL with filters
  const buildApiUrl = useCallback(() => {
    let url = 'http://localhost:5000/api/notes'
    const params = new URLSearchParams()
    
    if (activeFilter === 'favorites') {
      params.append('is_favorite', 'true')
    } else if (activeFilter === 'archive') {
      params.append('is_archived', 'true')
    }
    
    if (sortBy === 'pinned') {
      params.append('sort_by', 'pinned')
    } else if (sortBy === 'title') {
      params.append('sort_by', 'title_asc')
    } else if (sortBy === 'created') {
      params.append('sort_by', 'created_desc')
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }
    return url
  }, [activeFilter, sortBy])

  // Sort notes locally
  const getSortedNotes = useCallback((notesToSort) => {
    const sorted = [...notesToSort]
    
    switch (sortBy) {
      case 'pinned':
        sorted.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
        break
      case 'updated':
        sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        break
      case 'created':
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
      case 'title':
        sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break
      default:
        sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    }
    
    return sorted
  }, [sortBy])

  // Apply multiple filters (category + date)
  const applyMultipleFilters = useCallback((notesToFilter) => {
    let filtered = [...notesToFilter]
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(note => note.category === filterCategory)
    }
    
    const now = new Date()
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    switch (filterDate) {
      case 'today':
        filtered = filtered.filter(note => {
          const noteDate = new Date(note.created_at).toISOString().split('T')[0]
          return noteDate === today
        })
        break
      case 'week':
        filtered = filtered.filter(note => {
          const noteDate = new Date(note.created_at).toISOString().split('T')[0]
          return noteDate >= weekAgo
        })
        break
      case 'month':
        filtered = filtered.filter(note => {
          const noteDate = new Date(note.created_at).toISOString().split('T')[0]
          return noteDate >= monthAgo
        })
        break
      default:
        // No date filter applied
        break
    }
    
    return filtered
  }, [filterCategory, filterDate])

  // Filter notes by notebook/folder/tag
  const filterByPath = useCallback((fetchedNotes) => {
    const path = location.pathname
    
    if (path.startsWith('/notebook/')) {
      const notebookName = decodeURIComponent(path.split('/notebook/')[1])
      return fetchedNotes.filter(note => note.category === notebookName)
    }
    if (path.startsWith('/folder/')) {
      const folderName = decodeURIComponent(path.split('/folder/')[1])
      return fetchedNotes.filter(note => note.category === folderName)
    }
    if (path.startsWith('/tag/')) {
      const tagName = decodeURIComponent(path.split('/tag/')[1])
      return fetchedNotes.filter(note => note.tags?.includes(tagName))
    }
    
    return fetchedNotes
  }, [location.pathname])

  // Helper function for date filter label
  const getDateFilterLabel = () => {
    if (filterDate === 'today') return 'Today'
    if (filterDate === 'week') return 'This Week'
    if (filterDate === 'month') return 'This Month'
    return 'All Time'
  }

  // Fetch notes from backend
  const fetchNotes = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    try {
      setLoading(true)
      setError('')
      
      const url = buildApiUrl()
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      })
      
      if (response.status === 429) {
        if (isMountedRef.current) {
          setError('Too many requests. Please wait a moment before refreshing.')
          setLoading(false)
        }
        return
      }
      
      const data = await response.json()
      
      if (isMountedRef.current && response.ok && data.success) {
        let fetchedNotes = data.notes || []
        fetchedNotes = filterByPath(fetchedNotes)
        fetchedNotes = applyMultipleFilters(fetchedNotes)
        fetchedNotes = getSortedNotes(fetchedNotes)
        
        setNotes(fetchedNotes)
        setFilteredNotes(fetchedNotes)
        
        const today = new Date().toISOString().split('T')[0]
        const todayNotes = fetchedNotes.filter(note => {
          const noteDate = new Date(note.created_at).toISOString().split('T')[0]
          return noteDate === today
        }).length
        
        const favoriteCount = fetchedNotes.filter(note => note.is_favorite === true).length
        const pinnedCount = fetchedNotes.filter(note => note.is_pinned === true).length
        
        setStats(prev => ({
          ...prev,
          total: fetchedNotes.length,
          today: todayNotes,
          favorites: favoriteCount,
          pinned: pinnedCount,
        }))
      } else if (isMountedRef.current && !response.ok) {
        setError(data.message || 'Failed to fetch notes')
      }
    } catch (err) {
      if (err.name !== 'AbortError' && isMountedRef.current) {
        console.error('Error fetching notes:', err)
        setError('Unable to connect to server. Please make sure the backend is running.')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [token, buildApiUrl, filterByPath, applyMultipleFilters, getSortedNotes])

  // Debounced fetch
  useEffect(() => {
    if (!token) return
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchNotes()
    }, 500)
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [token, fetchNotes])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const handleSearch = (query) => {
  const trimmedQuery = query?.trim()
  if (trimmedQuery === undefined || trimmedQuery === '') {
    setFilteredNotes(notes)
  } else {
    const filtered = notes.filter(note => 
      note.title?.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      note.tags?.some(tag => tag.toLowerCase().includes(trimmedQuery.toLowerCase())) ||
      note.category?.toLowerCase().includes(trimmedQuery.toLowerCase())
    )
    setFilteredNotes(getSortedNotes(filtered))
  }
}

  const handleDeleteNote = async (noteId) => {
    const isConfirmed = globalThis.confirm('Are you sure you want to delete this note?')
    if (!isConfirmed) {
      return
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        const updatedNotes = notes.filter(note => note.id !== noteId && note._id !== noteId)
        setNotes(updatedNotes)
        setFilteredNotes(getSortedNotes(updatedNotes))
        setStats(prev => ({
          ...prev,
          total: updatedNotes.length
        }))
      } else {
        globalThis.alert(data.message || 'Failed to delete note')
      }
    } catch (err) {
      console.error('Error deleting note:', err)
      globalThis.alert('Unable to delete note. Please try again.')
    }
  }

  const handleToggleFavorite = async (noteId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}/favorite`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        fetchNotes()
      } else {
        console.error('Failed to toggle favorite:', data.message)
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
    }
  }

  const handleToggleArchive = async (noteId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        fetchNotes()
      } else {
        console.error('Failed to toggle archive:', data.message)
      }
    } catch (err) {
      console.error('Error toggling archive:', err)
    }
  }

  const handleTogglePin = async (noteId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}/pin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        fetchNotes()
      } else {
        console.error('Failed to toggle pin:', data.message)
      }
    } catch (err) {
      console.error('Error toggling pin:', err)
    }
  }

  const handleRefresh = () => {
    fetchNotes()
  }

  const clearAllFilters = () => {
    setFilterCategory('all')
    setFilterDate('all')
    setShowFilterBar(false)
  }

  const getPageSubtitle = () => {
    const path = location.pathname
    const hasMultipleNotes = stats.total !== 1
    const suffix = hasMultipleNotes ? 's' : ''
    
    if (path === '/favorites') return `You have ${stats.total} favorite note${suffix} saved`
    if (path === '/archive') return `You have ${stats.total} archived note${suffix}`
    if (path === '/categories') return 'Organize your notes by category'
    if (path.startsWith('/notebook/') || path.startsWith('/folder/') || path.startsWith('/tag/')) {
      return `${stats.total} note${suffix} in this collection`
    }
    return `You have ${stats.total} note${suffix} saved in your workspace.`
  }

  // Group notes by category for Categories view
  const getNotesByCategory = () => {
    const categories = {}
    notes.forEach(note => {
      const category = note.category || 'Personal'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(note)
    })
    return categories
  }

  const formatNotesForGrid = () => {
    return filteredNotes.map(note => ({
      id: note.id || note._id,
      title: note.title || 'Untitled',
      content: note.content || '',
      plain_content: note.plain_content || '',
      tags: note.category ? [note.category] : (note.tags || ['Personal']),
      category: note.category || 'Personal',
      is_favorite: note.is_favorite || false,
      is_archived: note.is_archived || false,
      is_pinned: note.is_pinned || false,
      color: note.color || '#ffffff',
      createdAt: note.created_at,
      updatedAt: note.updated_at
    }))
  }

  const renderNoteContent = () => {
    if (loading) {
      return (
        <div className="loading-notes">
          <div className="spinner"></div>
          <p>Loading your notes...</p>
        </div>
      )
    }
    
    if (viewMode === 'grid') {
      return (
        <NoteGrid 
          notes={formatNotesForGrid()} 
          onDelete={handleDeleteNote}
          onEdit={(note) => navigate(`/editor/${note.id}`)}
          onFavorite={handleToggleFavorite}
          onArchive={handleToggleArchive}
          onPin={handleTogglePin}
          onCreateNew={() => navigate('/editor/new')}
        />
      )
    }
    
    return (
      <NoteList 
        notes={formatNotesForGrid()} 
        onDelete={handleDeleteNote}
        onEdit={(note) => navigate(`/editor/${note.id}`)}
        onFavorite={handleToggleFavorite}
        onArchive={handleToggleArchive}
        onPin={handleTogglePin}
      />
    )
  }

  return (
    <div className="dashboard">
      <Sidebar onRefresh={handleRefresh} />
      <div className="dashboard-main">
        <TopNavbar onSearch={handleSearch} />
        <main className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section">
            <div className="welcome-text">
              <h1>{greeting}, {user?.name || 'User'}.</h1>
              <p>{getPageSubtitle()}</p>
            </div>
            
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon total">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div className="stat-info">
                  <h3>{stats.total}</h3>
                  <p>Total Notes</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon today">
                  <span className="material-symbols-outlined">today</span>
                </div>
                <div className="stat-info">
                  <h3>{stats.today}</h3>
                  <p>Notes Today</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon favorites">
                  <span className="material-symbols-outlined">star</span>
                </div>
                <div className="stat-info">
                  <h3>{stats.favorites}</h3>
                  <p>Favorites</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon pinned">
                  <span className="material-symbols-outlined">keep</span>
                </div>
                <div className="stat-info">
                  <h3>{stats.pinned}</h3>
                  <p>Pinned</p>
                </div>
              </div>
            </div>
          </section>

          {/* Sort Controls */}
          <div className="sort-controls">
            <div className="sort-left">
              <div className="view-toggle">
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  type="button"
                >
                  <span className="material-symbols-outlined">grid_view</span>
                </button>
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                  type="button"
                >
                  <span className="material-symbols-outlined">view_list</span>
                </button>
              </div>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
                aria-label="Sort notes by"
              >
                <option value="pinned">📌 Pinned first</option>
                <option value="updated">🕐 Recently updated</option>
                <option value="created">📅 Recently created</option>
                <option value="title">🔤 A to Z</option>
              </select>
            </div>
            
            {/* Filter Button */}
            <div className="filter-right">
              <button 
                className={`filter-btn ${showFilterBar ? 'active' : ''}`}
                onClick={() => setShowFilterBar(!showFilterBar)}
                type="button"
              >
                <span className="material-symbols-outlined">filter_alt</span>
                Filter
                {(filterCategory !== 'all' || filterDate !== 'all') && (
                  <span className="filter-active-dot"></span>
                )}
              </button>
              
              {showFilterBar && (
                <div className="filter-dropdown">
                  {/* Category Filter */}
                  <div className="filter-group">
                    <label htmlFor="categoryFilter">Category</label>
                    <div className="filter-options">
                      <button 
                        className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('all')}
                        type="button"
                      >
                        All
                      </button>
                      {['Personal', 'Work', 'Ideas', 'Journal', 'Health', 'Finance', 'Travel'].map(cat => (
                        <button 
                          key={cat}
                          className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                          onClick={() => setFilterCategory(cat)}
                          type="button"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Date Filter */}
                  <div className="filter-group">
                    <label htmlFor="dateFilter">Date</label>
                    <div className="filter-options">
                      <button 
                        className={`filter-chip ${filterDate === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterDate('all')}
                        type="button"
                      >
                        All Time
                      </button>
                      <button 
                        className={`filter-chip ${filterDate === 'today' ? 'active' : ''}`}
                        onClick={() => setFilterDate('today')}
                        type="button"
                      >
                        Today
                      </button>
                      <button 
                        className={`filter-chip ${filterDate === 'week' ? 'active' : ''}`}
                        onClick={() => setFilterDate('week')}
                        type="button"
                      >
                        This Week
                      </button>
                      <button 
                        className={`filter-chip ${filterDate === 'month' ? 'active' : ''}`}
                        onClick={() => setFilterDate('month')}
                        type="button"
                      >
                        This Month
                      </button>
                    </div>
                  </div>
                  
                  {/* Active Filters Display */}
                  {(filterCategory !== 'all' || filterDate !== 'all') && (
                    <div className="active-filters">
                      <span>Active filters:</span>
                      {filterCategory !== 'all' && (
                        <button className="active-filter-chip" onClick={() => setFilterCategory('all')} type="button">
                          {filterCategory} ✕
                        </button>
                      )}
                      {filterDate !== 'all' && (
                        <button className="active-filter-chip" onClick={() => setFilterDate('all')} type="button">
                          {getDateFilterLabel()} ✕
                        </button>
                      )}
                      <button className="clear-all-filters" onClick={clearAllFilters} type="button">
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span className="material-symbols-outlined">error_outline</span>
              <p>{error}</p>
              <button onClick={handleRefresh} className="retry-btn" type="button">Retry</button>
            </div>
          )}

          {/* Categories View */}
          {activeFilter === 'categories' && !loading && (
            <div className="categories-view">
              {Object.entries(getNotesByCategory()).map(([category, categoryNotes]) => (
                <div key={category} className="category-section">
                  <div 
                    className="category-header" 
                    style={{ borderLeftColor: categoryColors[category] || '#a78bfa' }}
                  >
                    <div className="category-title">
                      <span className="category-icon">{categoryIcons[category] || '📁'}</span>
                      <h2>{category}</h2>
                    </div>
                    <span 
                      className="category-count" 
                      style={{ 
                        background: `${categoryColors[category] || '#a78bfa'}20`, 
                        color: categoryColors[category] || '#a78bfa' 
                      }}
                    >
                      {categoryNotes.length} notes
                    </span>
                  </div>
                  {viewMode === 'grid' ? (
                    <NoteGrid 
                      notes={categoryNotes.map(note => ({
                        id: note.id || note._id,
                        title: note.title || 'Untitled',
                        content: note.content || '',
                        plain_content: note.plain_content || '',
                        tags: [category],
                        category: category,
                        is_favorite: note.is_favorite || false,
                        is_archived: note.is_archived || false,
                        is_pinned: note.is_pinned || false,
                        color: note.color || '#ffffff',
                        createdAt: note.created_at,
                        updatedAt: note.updated_at
                      }))}
                      onDelete={handleDeleteNote}
                      onEdit={(note) => navigate(`/editor/${note.id}`)}
                      onFavorite={handleToggleFavorite}
                      onArchive={handleToggleArchive}
                      onPin={handleTogglePin}
                      onCreateNew={() => navigate('/editor/new')}
                    />
                  ) : (
                    <NoteList 
                      notes={categoryNotes.map(note => ({
                        id: note.id || note._id,
                        title: note.title || 'Untitled',
                        content: note.content || '',
                        plain_content: note.plain_content || '',
                        tags: [category],
                        category: category,
                        is_favorite: note.is_favorite || false,
                        is_archived: note.is_archived || false,
                        is_pinned: note.is_pinned || false,
                        color: note.color || '#ffffff',
                        createdAt: note.created_at,
                        updatedAt: note.updated_at
                      }))}
                      onDelete={handleDeleteNote}
                      onEdit={(note) => navigate(`/editor/${note.id}`)}
                      onFavorite={handleToggleFavorite}
                      onArchive={handleToggleArchive}
                      onPin={handleTogglePin}
                    />
                  )}
                </div>
              ))}
              {notes.length === 0 && (
                <div className="empty-state">
                  <div className="empty-notes-icon">
                    <span className="material-symbols-outlined">folder</span>
                  </div>
                  <h3>No categories yet</h3>
                  <p>Create your first note to get started with categories.</p>
                  <button onClick={() => navigate('/editor/new')} className="create-first-btn" type="button">
                    Create New Note
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notes Grid/List */}
          {activeFilter !== 'categories' && renderNoteContent()}

          {/* Recent Activity Section */}
          {activeFilter === 'all' && (
            <section className="recent-activity">
              <div className="activity-card">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {notes.slice(0, 3).map((note, idx) => (
                    <div key={note.id || idx} className="activity-item">
                      <div className="activity-icon secondary">
                        <span className="material-symbols-outlined">edit_note</span>
                      </div>
                      <div className="activity-details">
                        <p className="activity-title">Updated &quot;{note.title || 'Untitled'}&quot;</p>
                        <p className="activity-time">
                          {note.updated_at ? new Date(note.updated_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && !loading && (
                    <div className="activity-item">
                      <div className="activity-icon neutral">
                        <span className="material-symbols-outlined">info</span>
                      </div>
                      <div className="activity-details">
                        <p className="activity-title">No notes yet. Create your first note!</p>
                        <p className="activity-time">Get started</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard