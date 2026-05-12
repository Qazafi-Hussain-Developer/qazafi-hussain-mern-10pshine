import React from 'react'
import { useNavigate } from 'react-router-dom'
import './NoteCard.css'

const NoteCard = ({ note, onDelete, onEdit }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/editor/${note.id}`)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(note)
    } else {
      navigate(`/editor/${note.id}`)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(note.id)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="note-card" onClick={handleClick}>
      <div className="note-card-header">
        <h3 className="note-title">{note.title || 'Untitled'}</h3>
        <div className="note-actions">
          <button className="note-action-btn" onClick={handleEdit} title="Edit">
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button className="note-action-btn delete-btn" onClick={handleDelete} title="Delete">
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
      
      <p className="note-preview">{note.content?.substring(0, 120) || 'No content...'}</p>
      
      <div className="note-footer">
        <div className="note-tags">
          {note.tags && note.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="note-tag">{tag}</span>
          ))}
        </div>
        <span className="note-date">{formatDate(note.updatedAt || note.createdAt)}</span>
      </div>
    </div>
  )
}

export default NoteCard