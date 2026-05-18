import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Layout/Sidebar'
import TopNavbar from '../../components/Layout/TopNavbar'
import { useAuth } from '../../context/AuthContext'
import './Trash.css'

const Trash = () => {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [trashedNotes, setTrashedNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTrashedNotes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notes/trash', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setTrashedNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error fetching trash:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${id}/restore`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchTrashedNotes()
      }
    } catch (error) {
      console.error('Error restoring note:', error)
    }
  }

  const handlePermanentDelete = async (id) => {
    if (window.confirm('Permanently delete this note? This cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/notes/${id}/permanent`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          fetchTrashedNotes()
        }
      } catch (error) {
        console.error('Error deleting note:', error)
      }
    }
  }

  const handleEmptyTrash = async () => {
    if (window.confirm('Empty trash? All notes will be permanently deleted.')) {
      for (const note of trashedNotes) {
        await handlePermanentDelete(note.id)
      }
    }
  }

  useEffect(() => {
    fetchTrashedNotes()
  }, [])

  return (
    <div className="trash-page">
      <Sidebar />
      <div className="trash-main">
        <TopNavbar />
        <div className="trash-content">
          <div className="trash-header">
            <div>
              <h1>Trash</h1>
              <p>Notes deleted within the last 30 days appear here.</p>
            </div>
            {trashedNotes.length > 0 && (
              <button onClick={handleEmptyTrash} className="empty-trash-btn">
                <span className="material-symbols-outlined">delete_sweep</span>
                Empty Trash
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : trashedNotes.length === 0 ? (
            <div className="empty-trash">
              <div className="empty-icon">
                <span className="material-symbols-outlined">delete_sweep</span>
              </div>
              <h3>Trash is empty</h3>
              <p>Notes you delete will appear here for 30 days before being permanently removed.</p>
            </div>
          ) : (
            <div className="trash-list">
              {trashedNotes.map(note => (
                <div key={note.id} className="trash-item">
                  <div className="trash-item-info">
                    <h3>{note.title || 'Untitled Note'}</h3>
                    <p>Deleted: {new Date(note.deleted_at).toLocaleDateString()}</p>
                  </div>
                  <div className="trash-item-actions">
                    <button onClick={() => handleRestore(note.id)} className="restore-btn">
                      <span className="material-symbols-outlined">restore</span>
                      Restore
                    </button>
                    <button onClick={() => handlePermanentDelete(note.id)} className="delete-permanent-btn">
                      <span className="material-symbols-outlined">delete_forever</span>
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Trash