import React from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import './NoteList.css'

const NoteList = ({ notes, onDelete, onEdit, onFavorite, onArchive, onPin }) => {
  const navigate = useNavigate()

  const handleClick = (note) => {
    if (onEdit) {
      onEdit(note)
    } else {
      navigate(`/editor/${note.id}`)
    }
  }

  const handleDelete = (e, noteId) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(noteId)
    }
  }

  const handleFavorite = (e, noteId, isFavorite) => {
    e.stopPropagation()
    if (onFavorite) {
      onFavorite(noteId, isFavorite)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const handleKeyPress = (e, note) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(note)
    }
  }

  if (!notes || notes.length === 0) {
    return (
      <output className="note-list-empty" aria-label="No notes found">
        <div className="empty-icon" aria-hidden="true">
          <span className="material-symbols-outlined">notes</span>
        </div>
        <h3>No notes found</h3>
        <p>Create your first note to get started</p>
      </output>
    )
  }

  return (
    <ul className="note-list" aria-label="Notes list">
      {notes.map((note) => (
        <li key={note.id} className="note-list-item">
          <button
            type="button"
            className="note-list-button"
            onClick={() => handleClick(note)}
            onKeyDown={(e) => handleKeyPress(e, note)}
            aria-label={`Edit note: ${note.title || 'Untitled'}`}
          >
            <div className="note-list-content">
              <div className="note-list-header">
                <h3 className="note-list-title">{note.title || 'Untitled'}</h3>
                <div className="note-list-actions">
                  <button 
                    type="button"
                    className={`list-action-btn ${note.is_favorite ? 'active' : ''}`}
                    onClick={(e) => handleFavorite(e, note.id, !note.is_favorite)}
                    aria-label={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {note.is_favorite ? 'star' : 'star_border'}
                    </span>
                  </button>
                  <button 
                    type="button"
                    className="list-action-btn delete"
                    onClick={(e) => handleDelete(e, note.id)}
                    aria-label="Delete note"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                  </button>
                </div>
              </div>
              <p className="note-list-preview">
                {note.plain_content?.substring(0, 100) || note.content?.substring(0, 100) || 'No content...'}
              </p>
              <div className="note-list-footer">
                {note.category && (
                  <span className="note-list-category">{note.category}</span>
                )}
                <span className="note-list-date">{formatDate(note.updatedAt || note.updated_at)}</span>
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

NoteList.propTypes = {
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string,
      content: PropTypes.string,
      plain_content: PropTypes.string,
      category: PropTypes.string,
      is_favorite: PropTypes.bool,
      is_archived: PropTypes.bool,
      is_pinned: PropTypes.bool,
      updated_at: PropTypes.string,
      updatedAt: PropTypes.string,
    })
  ).isRequired,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onFavorite: PropTypes.func,
  onArchive: PropTypes.func,
  onPin: PropTypes.func,
}

NoteList.defaultProps = {
  onDelete: null,
  onEdit: null,
  onFavorite: null,
  onArchive: null,
  onPin: null,
}

export default NoteList