import React, { useState, useEffect } from 'react'
import Sidebar from '../../components/Layout/Sidebar'
import TopNavbar from '../../components/Layout/TopNavbar'
import NoteGrid from '../../components/Notes/NoteGrid'
import './Dashboard.css'

const Dashboard = () => {
  const [notes, setNotes] = useState([])
  const [filteredNotes, setFilteredNotes] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    streak: 5
  })

  // Mock data - replace with API call
  useEffect(() => {
    const mockNotes = [
      {
        id: 1,
        title: 'Quarterly Design Strategy',
        content: 'Focusing on high-end UI patterns like Bento Grids and Glassmorphism for the next Lavender Notes update. We need to prioritize legibility and functional whitespace above all else...',
        tags: ['Work', 'Strategy'],
        createdAt: '2024-01-15T10:30:00',
        updatedAt: '2024-01-15T10:30:00'
      },
      {
        id: 2,
        title: 'Mindfulness Meditation Log',
        content: 'Started at 6:00 AM. Feeling calm but slightly distracted by the rain outside. Focused on breath for 20 minutes without interruption. Realized that the sound of rain helps...',
        tags: ['Health', 'Personal'],
        createdAt: '2024-01-14T08:00:00',
        updatedAt: '2024-01-14T08:00:00'
      },
      {
        id: 3,
        title: 'Grocery List for Dinner',
        content: 'Need to get fresh lavender for the scones, almond milk, organic honey, and some whole wheat flour. Don\'t forget the vanilla extract and a small bunch of mint leaves...',
        tags: ['Home', 'Weekly'],
        createdAt: '2024-01-13T15:20:00',
        updatedAt: '2024-01-13T15:20:00'
      }
    ]
    setNotes(mockNotes)
    setFilteredNotes(mockNotes)
    setStats({
      total: mockNotes.length,
      today: 1,
      streak: 5
    })
  }, [])

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  const handleSearch = (query) => {
    if (!query.trim()) {
      setFilteredNotes(notes)
    } else {
      const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
      setFilteredNotes(filtered)
    }
  }

  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId)
    setNotes(updatedNotes)
    setFilteredNotes(updatedNotes)
    setStats({
      ...stats,
      total: updatedNotes.length
    })
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-main">
        <TopNavbar onSearch={handleSearch} />
        <main className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section">
            <div className="welcome-text">
              <h1>{greeting}, {user.name || 'Julian'}.</h1>
              <p>You have {stats.total} note{stats.total !== 1 ? 's' : ''} saved in your workspace.</p>
            </div>
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </div>
                <div>
                  <p className="stat-label">Streak</p>
                  <p className="stat-value">{stats.streak} Days</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon secondary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                </div>
                <div>
                  <p className="stat-label">Created</p>
                  <p className="stat-value">{stats.today} Today</p>
                </div>
              </div>
            </div>
          </section>

          {/* Notes Grid */}
          <NoteGrid notes={filteredNotes} onDelete={handleDeleteNote} />

          {/* Recent Activity Section */}
          <section className="recent-activity">
            <div className="activity-card">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon secondary">
                    <span className="material-symbols-outlined">edit_note</span>
                  </div>
                  <div className="activity-details">
                    <p className="activity-title">Edited "Quarterly Design Strategy"</p>
                    <p className="activity-time">2 hours ago</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon primary">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <div className="activity-details">
                    <p className="activity-title">Created "Mindfulness Meditation Log"</p>
                    <p className="activity-time">5 hours ago</p>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon neutral">
                    <span className="material-symbols-outlined">folder</span>
                  </div>
                  <div className="activity-details">
                    <p className="activity-title">New category "Health" created</p>
                    <p className="activity-time">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pro-card">
              <div className="pro-card-bg"></div>
              <div className="pro-card-content">
                <h3>Pro Feature</h3>
                <p>Unlock advanced analytics and infinite cloud storage.</p>
                <button className="upgrade-btn">Upgrade Now</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default Dashboard