import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Layout/Sidebar'
import TopNavbar from '../../components/Layout/TopNavbar'
import { useAuth } from '../../context/AuthContext'
import './Settings.css'

const Settings = () => {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [settings, setSettings] = useState({
    theme: 'light',
    fontSize: 'medium',
    notifications: {
      email: true,
      push: true,
      marketing: false
    },
    privacy: {
      showEmail: true,
      allowSearch: true
    },
    editor: {
      autoSave: true,
      showWordCount: true,
      defaultCategory: 'Personal'
    }
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success && data.preferences) {
        setSettings({
          theme: data.preferences.appearance?.theme || 'light',
          fontSize: data.preferences.appearance?.fontSize || 'medium',
          notifications: {
            email: data.preferences.notifications?.email ?? true,
            push: data.preferences.notifications?.push ?? true,
            marketing: data.preferences.notifications?.marketing ?? false
          },
          privacy: {
            showEmail: data.preferences.privacy?.showEmail ?? true,
            allowSearch: data.preferences.privacy?.allowSearch ?? true
          },
          editor: {
            autoSave: data.preferences.editor?.autoSave ?? true,
            showWordCount: data.preferences.editor?.showWordCount ?? true,
            defaultCategory: data.preferences.editor?.defaultCategory || 'Personal'
          }
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const savePreference = async (type, data) => {
    try {
      let endpoint = ''
      let body = {}
      
      switch(type) {
        case 'theme':
          endpoint = 'http://localhost:5000/api/auth/profile'
          body = { theme: data }
          break
        case 'fontSize':
          endpoint = 'http://localhost:5000/api/auth/font-size'
          body = { fontSize: data }
          break
        case 'notifications':
          endpoint = 'http://localhost:5000/api/auth/notifications'
          body = data
          break
        case 'editor':
          endpoint = 'http://localhost:5000/api/auth/editor-preferences'
          body = data
          break
        case 'privacy':
          endpoint = 'http://localhost:5000/api/auth/privacy'
          body = data
          break
        default:
          return
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      
      const result = await response.json()
      if (response.ok && result.success) {
        return true
      }
      return false
    } catch (error) {
      console.error(`Error saving ${type}:`, error)
      return false
    }
  }

  const handleThemeChange = async (theme) => {
    setSettings({ ...settings, theme })
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    
    const success = await savePreference('theme', theme)
    if (success) {
      localStorage.setItem('theme', theme)
      setMessage({ type: 'success', text: 'Theme updated!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
    }
  }

  const handleFontSizeChange = async (fontSize) => {
    setSettings({ ...settings, fontSize })
    const success = await savePreference('fontSize', fontSize)
    if (success) {
      document.documentElement.style.fontSize = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px'
      setMessage({ type: 'success', text: 'Font size updated!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
    }
  }

  const handleNotificationChange = async (key) => {
    const newNotifications = {
      ...settings.notifications,
      [key]: !settings.notifications[key]
    }
    setSettings({
      ...settings,
      notifications: newNotifications
    })
    
    const success = await savePreference('notifications', newNotifications)
    if (success) {
      setMessage({ type: 'success', text: 'Notification settings saved!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 1500)
    }
  }

  const handlePrivacyChange = async (key) => {
    const newPrivacy = {
      ...settings.privacy,
      [key]: !settings.privacy[key]
    }
    setSettings({
      ...settings,
      privacy: newPrivacy
    })
    
    const success = await savePreference('privacy', newPrivacy)
    if (success) {
      setMessage({ type: 'success', text: 'Privacy settings saved!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 1500)
    }
  }

  const handleEditorChange = async (key, value) => {
    const newEditor = {
      ...settings.editor,
      [key]: value
    }
    setSettings({
      ...settings,
      editor: newEditor
    })
    
    const success = await savePreference('editor', newEditor)
    if (success) {
      setMessage({ type: 'success', text: 'Editor settings saved!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 1500)
    }
  }

  // ✅ Export Notes
  const handleExportNotes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      const exportData = {
        exportDate: new Date().toISOString(),
        notes: data.notes || [],
        version: '1.0',
        totalNotes: data.notes?.length || 0
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      setMessage({ type: 'success', text: `${exportData.totalNotes} notes exported successfully!` })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Export error:', error)
      setMessage({ type: 'error', text: 'Failed to export notes' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  // ✅ Import Notes
  const handleImportNotes = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result)
        
        if (!importedData.notes || !Array.isArray(importedData.notes)) {
          throw new Error('Invalid file format')
        }
        
        let importedCount = 0
        let failedCount = 0
        
        for (const note of importedData.notes) {
          try {
            await fetch('http://localhost:5000/api/notes', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: note.title || 'Imported Note',
                content: note.content || '',
                category: note.category || 'Personal',
                tags: note.tags || [],
                color: note.color || '#ffffff'
              })
            })
            importedCount++
          } catch (err) {
            failedCount++
            console.error('Failed to import note:', err)
          }
        }
        
        setMessage({ 
          type: 'success', 
          text: `Imported ${importedCount} notes successfully!${failedCount > 0 ? ` (${failedCount} failed)` : ''}` 
        })
        setTimeout(() => {
          setMessage({ type: '', text: '' })
          window.location.reload()
        }, 2000)
      } catch (error) {
        console.error('Import error:', error)
        setMessage({ type: 'error', text: 'Failed to import notes. Invalid file format.' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
    }
    reader.readAsText(file)
    
    e.target.value = ''
  }

  // Apply saved font size on mount
  useEffect(() => {
    const savedFontSize = settings.fontSize
    if (savedFontSize === 'small') {
      document.documentElement.style.fontSize = '14px'
    } else if (savedFontSize === 'large') {
      document.documentElement.style.fontSize = '18px'
    } else {
      document.documentElement.style.fontSize = '16px'
    }
  }, [])

  return (
    <div className="settings-page">
      <Sidebar />
      <div className="settings-main">
        <TopNavbar />
        <div className="settings-content">
          {/* Message Toast */}
          {message.text && (
            <div className={`settings-toast ${message.type}`}>
              <span className="material-symbols-outlined">
                {message.type === 'success' ? 'check_circle' : 'error_outline'}
              </span>
              <p>{message.text}</p>
            </div>
          )}

          <div className="settings-header">
            <h1>Settings</h1>
            <p>Customize your workspace experience</p>
          </div>

          <div className="settings-sections">
            {/* Appearance Section */}
            <div className="settings-card">
              <h2>Appearance</h2>
              <div className="theme-options">
                <button 
                  className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <span className="material-symbols-outlined">light_mode</span>
                  Light Mode
                </button>
                <button 
                  className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <span className="material-symbols-outlined">dark_mode</span>
                  Dark Mode
                </button>
                <button 
                  className={`theme-option ${settings.theme === 'system' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('system')}
                >
                  <span className="material-symbols-outlined">sync</span>
                  System Sync
                </button>
              </div>

              <div className="setting-item">
                <label>Font Size</label>
                <select 
                  value={settings.fontSize}
                  onChange={(e) => handleFontSizeChange(e.target.value)}
                  className="setting-select"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="settings-card">
              <h2>Notifications</h2>
              <div className="setting-toggle">
                <div>
                  <label>Email Notifications</label>
                  <p>Receive updates about your account and notes</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-toggle">
                <div>
                  <label>Push Notifications</label>
                  <p>Get real-time alerts on your device</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.push}
                    onChange={() => handleNotificationChange('push')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-toggle">
                <div>
                  <label>Marketing Communications</label>
                  <p>News, tips, and product updates</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.notifications.marketing}
                    onChange={() => handleNotificationChange('marketing')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {/* Editor Preferences */}
            <div className="settings-card">
              <h2>Editor Preferences</h2>
              <div className="setting-toggle">
                <div>
                  <label>Auto-Save</label>
                  <p>Automatically save your notes while typing</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.editor.autoSave}
                    onChange={() => handleEditorChange('autoSave', !settings.editor.autoSave)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-toggle">
                <div>
                  <label>Show Word Count</label>
                  <p>Display word and character count in editor</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.editor.showWordCount}
                    onChange={() => handleEditorChange('showWordCount', !settings.editor.showWordCount)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <label>Default Category</label>
                <select 
                  value={settings.editor.defaultCategory}
                  onChange={(e) => handleEditorChange('defaultCategory', e.target.value)}
                  className="setting-select"
                >
                  <option value="Personal">📝 Personal</option>
                  <option value="Work">💼 Work</option>
                  <option value="Ideas">💡 Ideas</option>
                  <option value="Journal">📓 Journal</option>
                  <option value="Health">🏃 Health</option>
                  <option value="Finance">💰 Finance</option>
                  <option value="Travel">✈️ Travel</option>
                </select>
              </div>
            </div>

            {/* Data Management - Export/Import Section */}
            <div className="settings-card">
              <h2>Data Management</h2>
              <div className="data-actions">
                <button onClick={handleExportNotes} className="export-btn">
                  <span className="material-symbols-outlined">download</span>
                  Export Notes
                </button>
                <label className="import-btn">
                  <span className="material-symbols-outlined">upload</span>
                  Import Notes
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportNotes} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
              <p className="data-hint">
                Export your notes as JSON backup or import previously exported notes. 
                Imported notes will be added to your existing collection.
              </p>
            </div>

            {/* Privacy & Data */}
            <div className="settings-card">
              <h2>Privacy & Data</h2>
              <div className="setting-toggle">
                <div>
                  <label>Show Email in Profile</label>
                  <p>Allow others to see your email address</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.showEmail}
                    onChange={() => handlePrivacyChange('showEmail')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="setting-toggle">
                <div>
                  <label>Allow Search Indexing</label>
                  <p>Let search engines index your public notes</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={settings.privacy.allowSearch}
                    onChange={() => handlePrivacyChange('allowSearch')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {/* About Section */}
            <div className="settings-card">
              <h2>About</h2>
              <div className="about-info">
                <p><strong>Lavender Notes</strong> v1.0.0</p>
                <p>© 2026 Lavender Notes. All rights reserved.</p>
                <div className="about-links">
                  <a href="#">Terms of Service</a>
                  <a href="#">Privacy Policy</a>
                  <a href="#">Contact Support</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings