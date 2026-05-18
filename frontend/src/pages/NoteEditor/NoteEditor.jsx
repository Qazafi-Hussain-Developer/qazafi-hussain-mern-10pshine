import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/Layout/Sidebar'
import Toolbar from '../../components/Editor/Toolbar'
import { useAuth } from '../../context/AuthContext'
import './NoteEditor.css'

const NoteEditor = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { token, user, updateUser } = useAuth()
  const editorRef = useRef(null)
  const imageInputRef = useRef(null)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Personal')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [isSaved, setIsSaved] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [noteColor, setNoteColor] = useState('#ffffff')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  // ✅ Invite/Collaboration states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [collaborators, setCollaborators] = useState([])

  // Available categories
  const availableCategories = [
    'Personal', 'Work', 'Ideas', 'Journal', 'Health',
    'Finance', 'Travel', 'Education', 'Shopping', 'Recipes', 'Projects'
  ]

  // Color options
  const colorOptions = [
    { value: '#ffffff', name: 'Default', icon: '🎨' },
    { value: '#fef3c7', name: 'Warm Yellow', icon: '🟡' },
    { value: '#fce7f3', name: 'Soft Pink', icon: '🌸' },
    { value: '#e0e7ff', name: 'Lavender', icon: '💜' },
    { value: '#dcfce7', name: 'Mint Green', icon: '🌿' },
    { value: '#ffedd5', name: 'Peach', icon: '🍑' },
    { value: '#dbeafe', name: 'Sky Blue', icon: '☁️' },
    { value: '#f1f5f9', name: 'Slate', icon: '🪨' },
  ]

  // Calculate read time (minutes)
  const calculateReadTime = () => {
    const plainText = content.replace(/<[^>]*>/g, '')
    const words = plainText.trim().split(/\s+/).filter(Boolean).length
    const readTime = Math.max(1, Math.ceil(words / 200))
    return { words, readTime }
  }

  const { words, readTime } = calculateReadTime()

  // Fetch note if editing existing
  useEffect(() => {
    if (id && id !== 'new') {
      fetchNote()
      fetchCollaborators() // ✅ Fetch collaborators for existing note
    }
  }, [id])

  const fetchNote = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/notes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        const note = data.note
        setTitle(note.title || '')
        setContent(note.content || '')
        setCategory(note.category || 'Personal')
        setTags(note.tags || [])
        setNoteColor(note.color || '#ffffff')
      } else {
        setError(data.message || 'Failed to load note')
      }
    } catch (error) {
      console.error('Error fetching note:', error)
      setError('Unable to load note. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Fetch collaborators for this note
  const fetchCollaborators = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${id}/collaborators`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setCollaborators(data.collaborators || [])
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error)
    }
  }

  // ✅ Handle invite
  const handleInvite = async () => {
    if (!inviteEmail) return
    
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${id}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail })
      })
      
      if (response.ok) {
        setCollaborators([...collaborators, { email: inviteEmail, role: 'viewer' }])
        setInviteEmail('')
        setShowInviteModal(false)
        alert('Invitation sent!')
      } else {
        const data = await response.json()
        alert(data.message || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error sending invite:', error)
      alert('Unable to send invitation. Please try again.')
    }
  }

  // ✅ Remove collaborator
  const handleRemoveCollaborator = async (email) => {
    if (!window.confirm(`Remove ${email} from this note?`)) return
    
    try {
      const response = await fetch(`http://localhost:5000/api/notes/${id}/collaborators`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })
      
      if (response.ok) {
        setCollaborators(collaborators.filter(c => c.email !== email))
        alert('Collaborator removed successfully')
      }
    } catch (error) {
      console.error('Error removing collaborator:', error)
      alert('Unable to remove collaborator')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }
    setSaving(true)
    try {
      const noteData = { title: title.trim(), content, category, tags, color: noteColor }
      let response
      if (id && id !== 'new') {
        response = await fetch(`http://localhost:5000/api/notes/${id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData)
        })
      } else {
        response = await fetch('http://localhost:5000/api/notes', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData)
        })
      }
      const data = await response.json()
      if (response.ok && data.success) {
        setIsSaved(true)
        navigate('/dashboard')
      } else {
        alert(data.message || 'Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Unable to save note. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!isSaved && (title || content)) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/dashboard')
      }
    } else {
      navigate('/dashboard')
    }
  }

  const handleShare = async () => {
    try {
      const shareableLink = `${window.location.origin}/shared/${id || 'new'}`
      setShareLink(shareableLink)
      setShowShareModal(true)
      await navigator.clipboard.writeText(shareableLink)
    } catch (error) {
      console.error('Error sharing note:', error)
      alert('Failed to generate share link')
    }
  }

  const handleExport = (format) => {
    const plainText = content.replace(/<[^>]*>/g, '')
    const date = new Date().toLocaleDateString()
    
    switch(format) {
      case 'md':
        const markdown = `# ${title}\n\n> Created: ${date} | Category: ${category} | Read time: ${readTime} min\n\n${plainText}\n\n---\n*Exported from Lavender Notes*`
        downloadFile(markdown, `${title.replace(/\s+/g, '_')}.md`, 'text/markdown')
        break
      case 'txt':
        const text = `${title}\n${'='.repeat(title.length)}\n\nCreated: ${date} | Category: ${category} | Read time: ${readTime} min\n\n${plainText}\n\n---\nExported from Lavender Notes`
        downloadFile(text, `${title.replace(/\s+/g, '_')}.txt`, 'text/plain')
        break
      case 'html':
        const html = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
            h1 { color: #1d1a21; border-bottom: 2px solid #a78bfa; padding-bottom: 10px; }
            .meta { color: #7a7583; font-size: 14px; margin-bottom: 30px; }
            .content { margin-top: 20px; }
            .content img { max-width: 100%; border-radius: 8px; }
            footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e6e0ea; font-size: 12px; color: #7a7583; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">📅 ${date} | 📁 ${category} | ⏱️ ${readTime} min read | 🏷️ ${tags.join(', ') || 'No tags'}</div>
          <div class="content">${content}</div>
          <footer>Exported from Lavender Notes</footer>
        </body>
        </html>`
        downloadFile(html, `${title.replace(/\s+/g, '_')}.html`, 'text/html')
        break
      default:
        break
    }
    setShowExportMenu(false)
  }

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
        setIsSaved(false)
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
    setIsSaved(false)
  }

  const handleContentChange = (e) => {
    setContent(e.target.value)
    setIsSaved(false)
  }

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    setIsSaved(false)
  }

  const handleCategoryChange = (e) => {
    setCategory(e.target.value)
    setIsSaved(false)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, GIF)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const imgTag = `<img src="${reader.result}" alt="Uploaded image" class="note-image" />`
      setContent(prev => prev + '\n' + imgTag + '\n')
      setIsSaved(false)
    }
    reader.readAsDataURL(file)
  }

  const handleFormat = (command, value) => {
    const editorTextarea = document.querySelector('.editor-textarea')
    if (editorTextarea) {
      editorTextarea.focus()
      document.execCommand(command, false, value)
      setTimeout(() => {
        setContent(editorTextarea.value)
        setIsSaved(false)
      }, 10)
    }
  }

  if (loading) {
    return (
      <div className="note-editor">
        <Sidebar />
        <div className="editor-main">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading note...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="note-editor">
        <Sidebar />
        <div className="editor-main">
          <div className="error-container">
            <span className="material-symbols-outlined">error_outline</span>
            <p>{error}</p>
            <button onClick={() => navigate('/dashboard')} className="back-to-dashboard">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
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
          </div>
          <div className="editor-meta-info">
            <span className="meta-badge saved">
              <span className="material-symbols-outlined">check_circle</span>
              {isSaved ? 'Saved' : 'Unsaved changes'}
            </span>
            <span className="meta-badge read-time">
              <span className="material-symbols-outlined">schedule</span>
              {readTime} min read
            </span>
            <span className="meta-badge category-badge">
              <span className="material-symbols-outlined">folder</span>
              {category}
            </span>
            {tags.length > 0 && (
              <span className="meta-badge tags-badge">
                <span className="material-symbols-outlined">local_offer</span>
                {tags.slice(0, 2).join(', ')}{tags.length > 2 ? ` +${tags.length - 2}` : ''}
              </span>
            )}
            {/* ✅ Collaborators count badge */}
            {collaborators.length > 0 && (
              <span className="meta-badge collaborators-badge">
                <span className="material-symbols-outlined">group</span>
                {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="header-right">
            <div className="action-buttons">
              {/* ✅ Invite Button */}
              <button className="invite-btn" onClick={() => setShowInviteModal(true)} title="Invite collaborators">
                <span className="material-symbols-outlined">person_add</span>
                Invite
              </button>
              <button className="share-btn" onClick={handleShare} title="Share note">
                <span className="material-symbols-outlined">share</span>
                Share
              </button>
              <div className="export-wrapper">
                <button className="export-btn" onClick={() => setShowExportMenu(!showExportMenu)} title="Export note">
                  <span className="material-symbols-outlined">download</span>
                  Export
                </button>
                {showExportMenu && (
                  <div className="export-menu">
                    <button onClick={() => handleExport('md')}>📄 Markdown (.md)</button>
                    <button onClick={() => handleExport('txt')}>📝 Text (.txt)</button>
                    <button onClick={() => handleExport('html')}>🌐 HTML (.html)</button>
                  </div>
                )}
              </div>
            </div>
            <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </header>

        {/* Share Modal */}
        {showShareModal && (
          <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Share Note</h3>
              <p>Share this link with others to view the note:</p>
              <div className="share-link-container">
                <input type="text" value={shareLink} readOnly />
                <button onClick={() => navigator.clipboard.writeText(shareLink)}>Copy</button>
              </div>
              <button className="close-modal" onClick={() => setShowShareModal(false)}>Close</button>
            </div>
          </div>
        )}

        {/* ✅ Invite Modal */}
        {showInviteModal && (
          <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
            <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Invite Collaborators</h3>
              <p>Add people by email to collaborate on this note.</p>
              <div className="invite-input-container">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                />
                <button onClick={handleInvite}>Send Invite</button>
              </div>
              {collaborators.length > 0 && (
                <div className="collaborators-list">
                  <h4>Current Collaborators</h4>
                  {collaborators.map((collab, index) => (
                    <div key={index} className="collaborator-item">
                      <span className="collaborator-email">{collab.email}</span>
                      <span className="collaborator-role">{collab.role}</span>
                      <button onClick={() => handleRemoveCollaborator(collab.email)} className="remove-collab">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button className="close-modal" onClick={() => setShowInviteModal(false)}>Close</button>
            </div>
          </div>
        )}

        <div className="editor-container">
          <Toolbar onFormat={handleFormat} />

          <div className="editor-content">
            <div className="editor-meta">
              <span className="meta-date">{new Date().toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
              })}</span>
              
              <div className="category-selector">
                <select value={category} onChange={handleCategoryChange} className="category-dropdown">
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>📁 {cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="color-picker">
              <label>Note Color</label>
              <div className="color-options">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    className={`color-option ${noteColor === color.value ? 'active' : ''}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setNoteColor(color.value)}
                    title={color.name}
                  >
                    {noteColor === color.value && <span className="check-icon">✓</span>}
                  </button>
                ))}
              </div>
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
                ref={editorRef}
                className="editor-textarea"
                placeholder="Start typing your minimalist masterpiece..."
                value={content}
                onChange={handleContentChange}
              />

              <div className="editor-sidebar">
                <div className="insight-card">
                  <h4>Note Insight</h4>
                  <p>Current category: <strong>{category}</strong></p>
                  <div className="word-count">
                    <span>Words</span>
                    <span>{words}</span>
                  </div>
                  <div className="char-count">
                    <span>Characters</span>
                    <span>{content.length}</span>
                  </div>
                  <div className="read-time-info">
                    <span>Read time</span>
                    <span>{readTime} min</span>
                  </div>
                  {id && id !== 'new' && (
                    <div className="note-id">
                      <span>Note ID</span>
                      <span className="id-value">#{id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="tags-section">
              <div className="tags-input-wrapper">
                <input
                  type="text"
                  className="tags-input"
                  placeholder="Add tags (press Enter)..."
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

            <div className="image-upload-section">
              <button className="image-upload-btn" onClick={() => imageInputRef.current?.click()}>
                <span className="material-symbols-outlined">image</span>
                Add Image
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>
          </div>

          <div className="attachments-section">
            <div className="attachment-card">
              <div className="attachment-image">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqYKFT9tcPpDujA7V7zrsWEqARH9o2L82VTWC02nMf0FP4xv4SZvouhkgBi4bjdXgSNaPaPStYGvvfBOjCx5jQdg9_NiQGJke7DZUTXHEaqLtQSoBp49qglpQsGqFA-eMbc7w8WMJTrIPzRAibcDm1N2mZL8EGM2tRHrL1j8V9RyZj7LN5MSoKcOBE947qAZbYs_Lh__X1q9Hq37KgDLM2fAXH7uIViIkBGC0fOgZK-tLYbL7NxTIRkhA--hQ1T4pYDUFgh4LWP0o" alt="Minimalist desk" />
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