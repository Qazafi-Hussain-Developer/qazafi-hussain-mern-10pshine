import React from 'react'
import NoteCard from './NoteCard'
import './NoteGrid.css'

const NoteGrid = ({ notes, onDelete, onEdit }) => {
  if (!notes || notes.length === 0) {
    return (
      <div className="empty-notes">
        <div className="empty-notes-icon">
          <span className="material-symbols-outlined">edit_note</span>
        </div>
        <h3>No notes yet</h3>
        <p>Create your first note to start organizing your thoughts.</p>
      </div>
    )
  }

  return (
    <div className="note-grid">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}

export default NoteGrid