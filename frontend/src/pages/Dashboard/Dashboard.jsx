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
  const { user, token, loading: authLoading } = useAuth()
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
    streak: 1,
    favorites: 0,
    pinned: 0,
    trash: 0,
    folders: 0
  })

  // Filter states
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [showFilterBar, setShowFilterBar] = useState(false)

  // Refs
  const debounceTimeoutRef = useRef(null)
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setStats({
          total: data.stats?.totalNotes || 0,
          today: data.stats?.notesToday || 0,
          streak: data.stats?.streak || 1,
          favorites: data.stats?.favorites || 0,
          pinned: data.stats?.pinned || 0,
          trash: data.stats?.trash || 0,
          folders: data.stats?.folders || 0
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }, [token])

  // Determine filter type from URL path
  useEffect(() => {
    const path = location.pathname
    
    if (path === '/favorites') setActiveFilter('favorites')
    else if (path === '/archive') setActiveFilter('archive')
    else if (path === '/categories') setActiveFilter('categories')
    else if (path.startsWith('/notebook/')) setActiveFilter('notebook')
    else if (path.startsWith('/folder/')) setActiveFilter('folder')
    else if (path.startsWith('/tag/')) setActiveFilter('tag')
    else setActiveFilter('all')
  }, [location.pathname])

  // Build API URL with filters
  const buildApiUrl = () => {
    let url = 'http://localhost:5000/api/notes'
    const params = new URLSearchParams()
    
    if (activeFilter === 'favorites') params.append('is_favorite', 'true')
    else if (activeFilter === 'archive') params.append('is_archived', 'true')
    
    if (sortBy === 'pinned') params.append('sort_by', 'pinned')
    else if (sortBy === 'title') params.append('sort_by', 'title_asc')
    else if (sortBy === 'created') params.append('sort_by', 'created_desc')
    
    if (params.toString()) url += `?${params.toString()}`
    return url
  }

  // Sort notes locally
  const getSortedNotes = (notesToSort) => {
    let sorted = [...notesToSort]
    
    if (sortBy === 'pinned') {
      sorted.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
    } else if (sortBy === 'updated') {
      sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    } else if (sortBy === 'created') {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    }
    return sorted
  }

  // Apply multiple filters
  const applyMultipleFilters = (notesToFilter) => {
    let filtered = [...notesToFilter]
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(note => note.category === filterCategory)
    }
    
    const now = new Date()
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0]
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0]
    
    if (filterDate === 'today') {
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.created_at).toISOString().split('T')[0]
        return noteDate === today
      })
    } else if (filterDate === 'week') {
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.created_at).toISOString().split('T')[0]
        return noteDate >= weekAgo
      })
    } else if (filterDate === 'month') {
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.created_at).toISOString().split('T')[0]
        return noteDate >= monthAgo
      })
    }
    return filtered
  }

  // Filter by path
  const filterByPath = (fetchedNotes) => {
    const path = location.pathname
    
    if (path.startsWith('/notebook/')) {
      const notebookName = decodeURIComponent(path.split('/notebook/')[1])
      return fetchedNotes.filter(note => note.category === notebookName)
    } else if (path.startsWith('/folder/')) {
      const folderName = decodeURIComponent(path.split('/folder/')[1])
      return fetchedNotes.filter(note => note.category === folderName)
    } else if (path.startsWith('/tag/')) {
      const tagName = decodeURIComponent(path.split('/tag/')[1])
      return fetchedNotes.filter(note => note.tags && note.tags.includes(tagName))
    }
    return fetchedNotes
  }

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    abortControllerRef.current = new AbortController()
    
    try {
      setLoading(true)
      setError('')
      
      const url = buildApiUrl()
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal
      })
      
      if (response.status === 401) return
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
          pinned: pinnedCount
        }))
      } else if (isMountedRef.current && !response.ok) {
        setError(data.message || 'Failed to fetch notes')
      }
    } catch (error) {
      if (error.name !== 'AbortError' && isMountedRef.current) {
        console.error('Error fetching notes:', error)
        setError('Unable to connect to server. Please make sure the backend is running.')
      }
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [token, activeFilter, sortBy, location.pathname, filterCategory, filterDate])

  // Fetch stats on mount
  useEffect(() => {
    if (token) fetchDashboardStats()
  }, [token, fetchDashboardStats])

  // Debounced fetch
  useEffect(() => {
    if (!token) return
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    debounceTimeoutRef.current = setTimeout(() => fetchNotes(), 500)
    return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current) }
  }, [token, activeFilter, sortBy, location.pathname, filterCategory, filterDate, fetchNotes])

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) abortControllerRef.current.abort()
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    }
  }, [])

  const handleSearch = (query) => {
    if (!query || !query.trim()) {
      setFilteredNotes(notes)
    } else {
      const filtered = notes.filter(note => 
        note.title?.toLowerCase().includes(query.toLowerCase()) ||
        note.content?.toLowerCase().includes(query.toLowerCase()) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) ||
        (note.category && note.category.toLowerCase().includes(query.toLowerCase()))
      )
      setFilteredNotes(getSortedNotes(filtered))
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        const updatedNotes = notes.filter(note => note.id !== noteId && note._id !== noteId)
        setNotes(updatedNotes)
        setFilteredNotes(getSortedNotes(updatedNotes))
        setStats(prev => ({ ...prev, total: updatedNotes.length }))
        fetchDashboardStats()
      } else {
        alert(data.message || 'Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Unable to delete note. Please try again.')
    }
  }

  const handleToggleFavorite = async (noteId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}/favorite`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        fetchNotes()
        fetchDashboardStats()
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleToggleArchive = async (noteId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}/archive`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        fetchNotes()
        fetchDashboardStats()
      }
    } catch (error) {
      console.error('Error toggling archive:', error)
    }
  }

  const handleTogglePin = async (noteId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}/pin`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        fetchNotes()
        fetchDashboardStats()
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
    }
  }

  const handleRefresh = () => {
    fetchNotes()
    fetchDashboardStats()
  }

  const clearAllFilters = () => {
    setFilterCategory('all')
    setFilterDate('all')
    setShowFilterBar(false)
  }

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/favorites') return 'Your Favorite Notes'
    if (path === '/archive') return 'Archived Notes'
    if (path === '/categories') return 'Categories'
    if (path.startsWith('/notebook/')) {
      const name = decodeURIComponent(path.split('/notebook/')[1])
      return `${name} Notebook`
    }
    if (path.startsWith('/folder/')) {
      const name = decodeURIComponent(path.split('/folder/')[1])
      return `${name} Folder`
    }
    if (path.startsWith('/tag/')) {
      const name = decodeURIComponent(path.split('/tag/')[1])
      return `#${name}`
    }
    return 'Dashboard'
  }

  const getPageSubtitle = () => {
    const path = location.pathname
    if (path === '/favorites') return `You have ${stats.favorites} favorite note${stats.favorites !== 1 ? 's' : ''} saved`
    if (path === '/archive') return `You have ${stats.archived || 0} archived note${stats.archived !== 1 ? 's' : ''}`
    if (path === '/categories') return 'Organize your notes by category'
    if (path.startsWith('/notebook/') || path.startsWith('/folder/') || path.startsWith('/tag/')) {
      return `${stats.total} note${stats.total !== 1 ? 's' : ''} in this collection`
    }
    return `You have ${stats.total} note${stats.total !== 1 ? 's' : ''} saved in your workspace.`
  }

  const getNotesByCategory = () => {
    const categories = {}
    notes.forEach(note => {
      const category = note.category || 'Personal'
      if (!categories[category]) categories[category] = []
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

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
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
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid View">
                  <span className="material-symbols-outlined">grid_view</span>
                </button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List View">
                  <span className="material-symbols-outlined">view_list</span>
                </button>
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                <option value="pinned">📌 Pinned first</option>
                <option value="updated">🕐 Recently updated</option>
                <option value="created">📅 Recently created</option>
                <option value="title">🔤 A to Z</option>
              </select>
            </div>
            
            <div className="filter-right">
              <button className={`filter-btn ${showFilterBar ? 'active' : ''}`} onClick={() => setShowFilterBar(!showFilterBar)}>
                <span className="material-symbols-outlined">filter_alt</span>
                Filter
                {(filterCategory !== 'all' || filterDate !== 'all') && <span className="filter-active-dot"></span>}
              </button>
              
              {showFilterBar && (
                <div className="filter-dropdown">
                  <div className="filter-group">
                    <label>Category</label>
                    <div className="filter-options">
                      <button className={`filter-chip ${filterCategory === 'all' ? 'active' : ''}`} onClick={() => setFilterCategory('all')}>All</button>
                      {['Personal', 'Work', 'Ideas', 'Journal', 'Health', 'Finance', 'Travel'].map(cat => (
                        <button key={cat} className={`filter-chip ${filterCategory === cat ? 'active' : ''}`} onClick={() => setFilterCategory(cat)}>{cat}</button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="filter-group">
                    <label>Date</label>
                    <div className="filter-options">
                      <button className={`filter-chip ${filterDate === 'all' ? 'active' : ''}`} onClick={() => setFilterDate('all')}>All Time</button>
                      <button className={`filter-chip ${filterDate === 'today' ? 'active' : ''}`} onClick={() => setFilterDate('today')}>Today</button>
                      <button className={`filter-chip ${filterDate === 'week' ? 'active' : ''}`} onClick={() => setFilterDate('week')}>This Week</button>
                      <button className={`filter-chip ${filterDate === 'month' ? 'active' : ''}`} onClick={() => setFilterDate('month')}>This Month</button>
                    </div>
                  </div>
                  
                  {(filterCategory !== 'all' || filterDate !== 'all') && (
                    <div className="active-filters">
                      <span>Active filters:</span>
                      {filterCategory !== 'all' && <button className="active-filter-chip" onClick={() => setFilterCategory('all')}>{filterCategory} ✕</button>}
                      {filterDate !== 'all' && <button className="active-filter-chip" onClick={() => setFilterDate('all')}>{filterDate === 'today' ? 'Today' : filterDate === 'week' ? 'This Week' : 'This Month'} ✕</button>}
                      <button className="clear-all-filters" onClick={clearAllFilters}>Clear all</button>
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
              <button onClick={handleRefresh} className="retry-btn">Retry</button>
            </div>
          )}

          {/* Categories View */}
          {activeFilter === 'categories' && !loading && (
            <div className="categories-view">
              {Object.entries(getNotesByCategory()).map(([category, categoryNotes]) => (
                <div key={category} className="category-section">
                  <div className="category-header" style={{ borderLeftColor: categoryColors[category] || '#a78bfa' }}>
                    <div className="category-title">
                      <span className="category-icon">{categoryIcons[category] || '📁'}</span>
                      <h2>{category}</h2>
                    </div>
                    <span className="category-count" style={{ background: (categoryColors[category] || '#a78bfa') + '20', color: categoryColors[category] || '#a78bfa' }}>
                      {categoryNotes.length} notes
                    </span>
                  </div>
                  {viewMode === 'grid' ? (
                    <NoteGrid notes={categoryNotes.map(note => ({
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
                    }))} onDelete={handleDeleteNote} onEdit={(note) => navigate(`/editor/${note.id}`)} onFavorite={handleToggleFavorite} onArchive={handleToggleArchive} onPin={handleTogglePin} onCreateNew={() => navigate('/editor/new')} />
                  ) : (
                    <NoteList notes={categoryNotes.map(note => ({
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
                    }))} onDelete={handleDeleteNote} onEdit={(note) => navigate(`/editor/${note.id}`)} onFavorite={handleToggleFavorite} onArchive={handleToggleArchive} onPin={handleTogglePin} />
                  )}
                </div>
              ))}
              {notes.length === 0 && (
                <div className="empty-state">
                  <div className="empty-notes-icon"><span className="material-symbols-outlined">folder</span></div>
                  <h3>No categories yet</h3>
                  <p>Create your first note to get started with categories.</p>
                  <button onClick={() => navigate('/editor/new')} className="create-first-btn">Create New Note</button>
                </div>
              )}
            </div>
          )}

          {/* Notes Grid/List */}
          {activeFilter !== 'categories' && (
            loading ? (
              <div className="loading-notes">
                <div className="spinner"></div>
                <p>Loading your notes...</p>
              </div>
            ) : viewMode === 'grid' ? (
              <NoteGrid notes={formatNotesForGrid()} onDelete={handleDeleteNote} onEdit={(note) => navigate(`/editor/${note.id}`)} onFavorite={handleToggleFavorite} onArchive={handleToggleArchive} onPin={handleTogglePin} onCreateNew={() => navigate('/editor/new')} />
            ) : (
              <NoteList notes={formatNotesForGrid()} onDelete={handleDeleteNote} onEdit={(note) => navigate(`/editor/${note.id}`)} onFavorite={handleToggleFavorite} onArchive={handleToggleArchive} onPin={handleTogglePin} />
            )
          )}

          {/* Recent Activity */}
          {activeFilter === 'all' && (
            <section className="recent-activity">
              <div className="activity-card">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {notes.slice(0, 3).map((note, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon secondary"><span className="material-symbols-outlined">edit_note</span></div>
                      <div className="activity-details">
                        <p className="activity-title">Updated "{note.title || 'Untitled'}"</p>
                        <p className="activity-time">{note.updated_at ? new Date(note.updated_at).toLocaleDateString() : 'Recently'}</p>
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && !loading && (
                    <div className="activity-item">
                      <div className="activity-icon neutral"><span className="material-symbols-outlined">info</span></div>
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