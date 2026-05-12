import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Layout/Sidebar'
import Toolbar from '../../components/Editor/Toolbar'
import './NoteEditor.css'

const NoteEditor = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [isSaved, setIsSaved] = useState(true)

  useEffect(() => {
    // Load note if editing existing
    if (id) {
      const mockNote = {
        id: parseInt(id),
        title: 'Quarterly Design Strategy',
        content: 'Focusing on high-end UI patterns like Bento Grids and Glassmorphism for the next Lavender Notes update. We need to prioritize legibility and functional whitespace above all else...',
        tags: ['Work', 'Strategy']
      }
      setTitle(mockNote.title)
      setContent(mockNote.content)
      setTags(mockNote.tags)
    }
  }, [id])

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    setIsSaved(true)
    console.log('Saving note:', { id, title, content, tags })
    navigate('/')
  }

  const handleCancel = () => {
    if (!isSaved && (title || content)) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/')
      }
    } else {
      navigate('/')
    }
  }

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleContentChange = (e) => {
    setContent(e.target.value)
    setIsSaved(false)
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    setIsSaved(false)
  }

  const handleFormat = (command, value) => {
    document.execCommand(command, false, value)
    setIsSaved(false)
  }

  return (
    <div className="note-editor">
      <Sidebar />
      <div className="editor-main">
        <header className="editor-header">
          <div className="header-left">
            <button className="back-btn" onClick={handleCancel}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="search-wrapper">
              <span className="material-symbols-outlined search-icon">search</span>
              <input type="text" placeholder="Search in notes..." className="editor-search" />
            </div>
          </div>
          <div className="header-right">
            <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
            <button className="save-btn" onClick={handleSave}>Save</button>
          </div>
        </header>

        <div className="editor-container">
          <Toolbar onFormat={handleFormat} />

          <div className="editor-content">
            <div className="editor-meta">
              <span className="meta-date">{new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              {tags.length > 0 && (
                <div className="meta-tags">
                  <span className="tag-dot"></span>
                  <span>{tags.join(', ')}</span>
                </div>
              )}
            </div>

            <input
              type="text"
              className="editor-title"
              placeholder="Title your thoughts..."
              value={title}
              onChange={handleTitleChange}
            />

            <div className="editor-body">
              <textarea
                className="editor-textarea"
                placeholder="Start typing your minimalist masterpiece..."
                value={content}
                onChange={handleContentChange}
              />

              <div className="editor-sidebar">
                <div className="insight-card">
                  <h4>Note Insight</h4>
                  <p>Your last entry in this category focused on "User Retention."</p>
                  <div className="word-count">
                    <span>Word Count</span>
                    <span>{content.trim().split(/\s+/).filter(Boolean).length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tags-section">
              <div className="tags-input-wrapper">
                <input
                  type="text"
                  className="tags-input"
                  placeholder="Add tags..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
              <div className="tags-list">
                {tags.map((tag, index) => (
                  <span key={index} className="editor-tag">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="remove-tag">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="attachments-section">
            <div className="attachment-card">
              <div className="attachment-image">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqYKFT9tcPpDujA7V7zrsWEqARH9o2L82VTWC02nMf0FP4xv4SZvouhkgBi4bjdXgSNaPaPStYGvvfBOjCx5jQdg9_NiQGJke7DZUTXHEaqLtQSoBp49qglpQsGqFA-eMbc7w8WMJTrIPzRAibcDm1N2mZL8EGM2tRHrL1j8V9RyZj7LN5MSoKcOBE947qAZbYs_Lh__X1q9Hq37KgDLM2fAXH7uIViIkBGC0fOgZK-tLYbL7NxTIRkhA--hQ1T4pYDUFgh4LWP0o"
                  alt="Minimalist desk"
                />
                <button className="remove-attachment">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="attachment-info">
                <p className="attachment-label">Attached Reference</p>
                <p className="attachment-name">Workspace_Inspiration_01.jpg</p>
              </div>
              <span className="attachment-icon">
                <span className="material-symbols-outlined">visibility</span>
              </span>
            </div>
            <div className="add-attachment">
              <div className="add-attachment-icon">
                <span className="material-symbols-outlined">add_circle</span>
              </div>
              <h4>Add Attachment</h4>
              <p>PDFs, Images, or Links</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoteEditor