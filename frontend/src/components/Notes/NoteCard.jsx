import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './NoteCard.css'

const NoteCard = ({ note, onDelete, onEdit, onFavorite, onArchive, onPin, onRestore, isTrashed = false }) => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleClick = () => {
    if (!isTrashed) {
      navigate(`/editor/${note.id}`)
    }
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    if (isTrashed) return
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

  const handleRestore = (e) => {
    e.stopPropagation()
    if (onRestore) {
      onRestore(note.id)
    }
  }

  const handleFavorite = (e) => {
    e.stopPropagation()
    if (onFavorite && !isTrashed) {
      onFavorite(note.id)
    }
  }

  const handleArchive = (e) => {
    e.stopPropagation()
    if (onArchive && !isTrashed && !note.is_archived) {
      onArchive(note.id)
    }
  }

  const handlePin = (e) => {
    e.stopPropagation()
    if (onPin && !isTrashed) {
      onPin(note.id)
    }
  }

  // Strip HTML tags for preview
  const stripHtml = (html) => {
    if (!html) return ''
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent || temp.innerText || ''
  }

  // Calculate read time (minutes)
  const calculateReadTime = () => {
    const previewText = getPreviewText()
    const words = previewText.trim().split(/\s+/).filter(Boolean).length
    const readTime = Math.max(1, Math.ceil(words / 200))
    return readTime
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently'
    
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

  // Get preview text (strip HTML and limit length)
  const getPreviewText = () => {
    if (note.plain_content) {
      return note.plain_content.substring(0, 120)
    }
    const text = stripHtml(note.content || '')
    return text.substring(0, 120) || 'No content...'
  }

  const readTime = calculateReadTime()
  const deletedDate = note.deleted_at ? formatDate(note.deleted_at) : null

  // Determine if we should show custom color (only for non-default colors)
  const customColor = note.color && note.color !== '#ffffff' ? note.color : null

  return (
    <div 
      className={`note-card ${note.is_favorite ? 'favorite' : ''} ${note.is_pinned ? 'pinned' : ''} ${isTrashed ? 'trashed' : ''}`} 
      onClick={handleClick}
      style={customColor ? { backgroundColor: customColor } : {}}
    >
      <div className="note-card-header">
        <h3 className="note-title">{note.title || 'Untitled'}</h3>
        <div className="note-actions">
          {/* Pin Button */}
          {onPin && !isTrashed && (
            <button 
              className={`note-action-btn pin-btn ${note.is_pinned ? 'active' : ''}`} 
              onClick={handlePin} 
              title={note.is_pinned ? 'Unpin' : 'Pin to top'}
            >
              <span className="material-symbols-outlined">
                {note.is_pinned ? 'keep' : 'keep_off'}
              </span>
            </button>
          )}
          
          {/* Favorite Button */}
          {onFavorite && !isTrashed && (
            <button 
              className={`note-action-btn favorite-btn ${note.is_favorite ? 'active' : ''}`} 
              onClick={handleFavorite} 
              title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span className="material-symbols-outlined">
                {note.is_favorite ? 'star' : 'star_border'}
              </span>
            </button>
          )}
          
          {/* Archive Button */}
          {onArchive && !isTrashed && !note.is_archived && (
            <button className="note-action-btn archive-btn" onClick={handleArchive} title="Archive">
              <span className="material-symbols-outlined">archive</span>
            </button>
          )}
          
          {/* Restore Button (for trashed notes) */}
          {isTrashed && onRestore && (
            <button className="note-action-btn restore-btn" onClick={handleRestore} title="Restore">
              <span className="material-symbols-outlined">restore_from_trash</span>
            </button>
          )}
          
          {/* Edit Button */}
          {!isTrashed && (
            <button className="note-action-btn edit-btn" onClick={handleEdit} title="Edit">
              <span className="material-symbols-outlined">edit</span>
            </button>
          )}
          
          {/* Delete/Permanent Delete Button */}
          <button 
            className={`note-action-btn delete-btn ${isTrashed ? 'permanent-delete' : ''}`} 
            onClick={handleDelete} 
            title={isTrashed ? 'Permanently Delete' : 'Move to Trash'}
          >
            <span className="material-symbols-outlined">
              {isTrashed ? 'delete_forever' : 'delete'}
            </span>
          </button>
        </div>
      </div>
      
      <p className="note-preview">{getPreviewText()}</p>
      
      <div className="note-footer">
        <div className="note-tags">
          {note.tags && note.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="note-tag">#{tag}</span>
          ))}
          {note.category && !note.tags?.includes(note.category) && (
            <span className="note-tag category-tag">{note.category}</span>
          )}
        </div>
        <div className="note-meta">
          {!isTrashed && (
            <span className="read-time" title="Estimated reading time">
              📖 {readTime} min read
            </span>
          )}
          {isTrashed && deletedDate && (
            <span className="deleted-date" title="Deleted date">
              🗑️ Deleted {deletedDate}
            </span>
          )}
          <span className="note-date" title={note.updatedAt ? 'Last updated' : 'Created'}>
            {formatDate(note.updatedAt || note.createdAt)}
          </span>
        </div>
      </div>

      {/* Folder indicator if note is in a folder */}
      {note.folder_name && !isTrashed && (
        <div className="note-folder-indicator">
          <span className="material-symbols-outlined">folder</span>
          <span>{note.folder_name}</span>
        </div>
      )}
    </div>
  )
}

export default NoteCard;