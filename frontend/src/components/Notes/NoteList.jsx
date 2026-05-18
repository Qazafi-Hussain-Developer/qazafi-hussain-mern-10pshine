import React from 'react'
import { useNavigate } from 'react-router-dom'
import './NoteList.css'

const NoteList = ({ notes, onDelete, onEdit, onFavorite, onArchive, onPin }) => {
  const navigate = useNavigate()

  const stripHtml = (html) => {
    if (!html) return ''
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent || temp.innerText || ''
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="note-list">
      <div className="list-header">
        <div className="list-cell title">Title</div>
        <div className="list-cell category">Category</div>
        <div className="list-cell updated">Updated</div>
        <div className="list-cell actions">Actions</div>
      </div>
      {notes.map(note => (
        <div key={note.id} className={`list-item ${note.is_pinned ? 'pinned' : ''}`}>
          <div className="list-cell title" onClick={() => navigate(`/editor/${note.id}`)}>
            {note.is_pinned && <span className="pin-icon">📌</span>}
            <span className="title-text">{note.title || 'Untitled'}</span>
          </div>
          <div className="list-cell category">
            <span className="category-badge">{note.category || 'Personal'}</span>
          </div>
          <div className="list-cell updated">{formatDate(note.updatedAt || note.createdAt)}</div>
          <div className="list-cell actions">
            {onPin && (
              <button onClick={(e) => { e.stopPropagation(); onPin(note.id) }} title={note.is_pinned ? 'Unpin' : 'Pin'}>
                <span className="material-symbols-outlined">{note.is_pinned ? 'keep' : 'keep_off'}</span>
              </button>
            )}
            {onFavorite && (
              <button onClick={(e) => { e.stopPropagation(); onFavorite(note.id) }} title={note.is_favorite ? 'Remove favorite' : 'Add favorite'}>
                <span className="material-symbols-outlined">{note.is_favorite ? 'star' : 'star_border'}</span>
              </button>
            )}
            {onArchive && (
              <button onClick={(e) => { e.stopPropagation(); onArchive(note.id) }} title="Archive">
                <span className="material-symbols-outlined">archive</span>
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); navigate(`/editor/${note.id}`) }} title="Edit">
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(note.id) }} title="Delete">
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      ))}
      {notes.length === 0 && (
        <div className="empty-list">No notes found. Create your first note!</div>
      )}
    </div>
  )
}

export default NoteList