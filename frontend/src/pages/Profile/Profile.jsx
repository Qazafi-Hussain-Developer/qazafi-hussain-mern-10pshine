import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Layout/Sidebar'
import TopNavbar from '../../components/Layout/TopNavbar'
import { useAuth } from '../../context/AuthContext'
import './Profile.css'

const Profile = () => {
  const navigate = useNavigate()
  const { token, user: authUser, logout, updateUser } = useAuth()
  const fileInputRef = useRef(null)
  
  const [user, setUser] = useState({
    name: '',
    email: '',
    displayName: '',
    bio: '',
    joinDate: '',
    totalNotes: 0,
    totalFolders: 0,
    timezone: 'Pacific Standard Time (PST)',
    twoFactorEnabled: false,
    activeSessions: 1,
    theme: 'light',
    avatar: null,
    avatarPreview: null
  })
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Fetch user profile from backend
  useEffect(() => {
    fetchUserProfile()
    fetchUserStats()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        const profileData = {
          name: data.user.name || '',
          email: data.user.email || '',
          displayName: data.user.name || '',
          bio: data.user.bio || 'Passionate about capturing ideas and organizing thoughts. ✨',
          joinDate: data.user.created_at 
            ? new Date(data.user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
            : 'May 2024',
          timezone: data.user.timezone || 'Pacific Standard Time (PST)',
          twoFactorEnabled: data.user.twoFactorEnabled || false,
          theme: data.user.theme || 'light',
          avatar: data.user.avatar || null,
          avatarPreview: data.user.avatar || null,
          preferences: data.user.preferences || {}
        }
        setUser(profileData)
        setFormData(profileData)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setUser(prev => ({
          ...prev,
          totalNotes: data.stats?.totalNotes || 0,
          totalFolders: data.stats?.folders || 0
        }))
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        setUser(prev => ({
          ...prev,
          activeSessions: data.count || 1
        }))
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  // Fetch active sessions on mount
  useEffect(() => {
    if (token) {
      fetchActiveSessions()
    }
  }, [token])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return
    }

    setUploadingAvatar(true)

    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Image = reader.result
      setUser(prev => ({ ...prev, avatarPreview: base64Image }))
      
      try {
        const response = await fetch('http://localhost:5000/api/auth/avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ avatarUrl: base64Image })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setUser(prev => ({ ...prev, avatar: base64Image, avatarPreview: base64Image }))
          updateUser({ avatar: base64Image })
          setMessage({ type: 'success', text: 'Avatar updated successfully!' })
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to upload avatar' })
          setUser(prev => ({ ...prev, avatarPreview: user.avatar }))
        }
      } catch (error) {
        console.error('Error uploading avatar:', error)
        setMessage({ type: 'error', text: 'Unable to upload avatar. Please try again.' })
        setUser(prev => ({ ...prev, avatarPreview: user.avatar }))
      } finally {
        setUploadingAvatar(false)
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
    }
    
    reader.readAsDataURL(file)
  }

  const handleUpdate = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.displayName,
          email: formData.email,
          bio: formData.bio,
          theme: formData.theme || user.theme,
          timezone: formData.timezone
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        const updatedUser = {
          ...user,
          name: data.user.name,
          email: data.user.email,
          displayName: data.user.name,
          bio: formData.bio || user.bio,
          theme: data.user.theme,
          timezone: data.user.timezone || user.timezone
        }
        setUser(updatedUser)
        setFormData({
          ...formData,
          displayName: data.user.name,
          email: data.user.email
        })
        
        updateUser({ 
          name: data.user.name, 
          email: data.user.email,
          bio: formData.bio,
          theme: data.user.theme,
          timezone: data.user.timezone
        })
        
        setIsEditing(false)
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Unable to update profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    const currentPassword = prompt('Enter your current password:')
    if (!currentPassword) return
    
    const newPassword = prompt('Enter your new password (min 6 characters):')
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    
    const confirmPassword = prompt('Confirm your new password:')
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to change password' })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setMessage({ type: 'error', text: 'Unable to change password. Please try again.' })
    }
  }

  const handleToggleTwoFactor = async () => {
    const newState = !user.twoFactorEnabled
    try {
      const response = await fetch('http://localhost:5000/api/auth/two-factor', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: newState })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setUser({ ...user, twoFactorEnabled: newState })
        setMessage({ type: 'success', text: data.message })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update two-factor authentication' })
      }
    } catch (error) {
      console.error('Error toggling two-factor:', error)
      setMessage({ type: 'error', text: 'Unable to update two-factor authentication' })
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('⚠️ WARNING: This will permanently delete your account and ALL your notes. This action cannot be undone. Are you absolutely sure?')) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/delete-account', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          logout()
          navigate('/login')
        } else {
          setMessage({ type: 'error', text: 'Failed to delete account' })
        }
      } catch (error) {
        console.error('Error deleting account:', error)
        setMessage({ type: 'error', text: 'Unable to delete account' })
      }
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout()
      navigate('/login')
    }
  }

  const handleThemeChange = async (theme) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setUser({ ...user, theme })
        setFormData({ ...formData, theme })
        
        updateUser({ theme })
        
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
        
        localStorage.setItem('theme', theme)
        setMessage({ type: 'success', text: 'Theme updated!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 2000)
      }
    } catch (error) {
      console.error('Error updating theme:', error)
    }
  }

  if (loading && !user.name) {
    return (
      <div className="profile-page">
        <Sidebar />
        <div className="profile-main">
          <TopNavbar />
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-main">
        <TopNavbar />
        
        <div className="profile-content">
          {/* Message Toast */}
          {message.text && (
            <div className={`message-toast ${message.type}`}>
              <span className="material-symbols-outlined">
                {message.type === 'success' ? 'check_circle' : 'error_outline'}
              </span>
              <p>{message.text}</p>
            </div>
          )}

          {/* Hero Section / Identity Card */}
          <div className="profile-hero">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-large">
                {user.avatarPreview || user.avatar ? (
                  <img 
                    src={user.avatarPreview || user.avatar} 
                    alt="Profile" 
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                )}
              </div>
              <button 
                className="avatar-edit-btn"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>
            <div className="profile-info">
              <h1>{user.displayName}</h1>
              <p>{user.email}</p>
              <div className="profile-badges">
                <span className="badge pro">Pro Member</span>
                <span className="badge beta">Beta Tester</span>
                <span className="badge early">Early Adopter</span>
              </div>
            </div>
            <div className="profile-actions">
              <button 
                className="edit-profile-action-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
              <button 
                className="logout-action-btn"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="profile-stats">
            <div className="stat-card-mini">
              <span className="stat-icon-mini">📝</span>
              <div>
                <h3>{user.totalNotes}</h3>
                <p>Total Notes</p>
              </div>
            </div>
            <div className="stat-card-mini">
              <span className="stat-icon-mini">📁</span>
              <div>
                <h3>{user.totalFolders}</h3>
                <p>Folders</p>
              </div>
            </div>
            <div className="stat-card-mini">
              <span className="stat-icon-mini">⭐</span>
              <div>
                <h3>{user.totalNotes > 0 ? Math.floor(user.totalNotes * 0.3) : 0}</h3>
                <p>Favorites</p>
              </div>
            </div>
            <div className="stat-card-mini">
              <span className="stat-icon-mini">🔥</span>
              <div>
                <h3>{user.totalNotes > 0 ? Math.floor(user.totalNotes / 7) || 1 : 1}</h3>
                <p>Week Streak</p>
              </div>
            </div>
          </div>

          {/* Settings Grid */}
          <div className="profile-settings-grid">
            {/* Account Settings */}
            <div className="profile-card">
              <div className="card-header">
                <span className="material-symbols-outlined">manage_accounts</span>
                <h2>Account Settings</h2>
              </div>
              {isEditing ? (
                <div className="profile-form">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName || user.displayName}
                      onChange={handleChange}
                      className="profile-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || user.email}
                      onChange={handleChange}
                      className="profile-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio || user.bio}
                      onChange={handleChange}
                      className="profile-textarea"
                      rows="3"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Timezone</label>
                    <select
                      name="timezone"
                      value={formData.timezone || user.timezone}
                      onChange={handleChange}
                      className="profile-select"
                    >
                      <option>Pacific Standard Time (PST)</option>
                      <option>Eastern Standard Time (EST)</option>
                      <option>Central Standard Time (CST)</option>
                      <option>Mountain Standard Time (MST)</option>
                      <option>Greenwich Mean Time (GMT)</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button onClick={() => setIsEditing(false)} className="cancel-update-btn">
                      Cancel
                    </button>
                    <button onClick={handleUpdate} className="update-btn" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Account'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="profile-details">
                    <div className="detail-row">
                      <span className="detail-label">Display Name</span>
                      <span className="detail-value">{user.displayName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email Address</span>
                      <span className="detail-value">{user.email}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Bio</span>
                      <span className="detail-value">{user.bio || 'No bio added yet'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Member Since</span>
                      <span className="detail-value">{user.joinDate}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Timezone</span>
                      <span className="detail-value">{user.timezone}</span>
                    </div>
                  </div>
                  <button onClick={() => setIsEditing(true)} className="edit-profile-btn">
                    Edit Profile
                  </button>
                </>
              )}
            </div>

            {/* Security Settings */}
            <div className="profile-card">
              <div className="card-header">
                <span className="material-symbols-outlined">shield</span>
                <h2>Security</h2>
              </div>
              <div className="security-item" onClick={handleChangePassword}>
                <div className="security-item-left">
                  <span className="material-symbols-outlined">password</span>
                  <div>
                    <p className="security-label">Password</p>
                    <p className="security-description">Change your password</p>
                  </div>
                </div>
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
              <div className="security-item">
                <div className="security-item-left">
                  <span className="material-symbols-outlined">vibration</span>
                  <div>
                    <p className="security-label">Two-Factor Auth</p>
                    <p className="security-description enabled">{user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={user.twoFactorEnabled}
                    onChange={handleToggleTwoFactor}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="security-item">
                <div className="security-item-left">
                  <span className="material-symbols-outlined">devices</span>
                  <div>
                    <p className="security-label">Active Sessions</p>
                    <p className="security-description">{user.activeSessions} device{user.activeSessions !== 1 ? 's' : ''} currently logged in</p>
                  </div>
                </div>
                <span className="material-symbols-outlined">chevron_right</span>
              </div>

              {/* Danger Zone */}
              <div className="danger-zone">
                <h5>Danger Zone</h5>
                <p>Permanently delete your account and all your note data.</p>
                <button onClick={handleDeleteAccount} className="delete-account-btn">
                  Delete Account
                </button>
              </div>
            </div>

            {/* Appearance & Preferences */}
            <div className="profile-card full-width">
              <div className="card-header">
                <span className="material-symbols-outlined">palette</span>
                <h2>Appearance & Preferences</h2>
              </div>
              <div className="theme-options">
                <button 
                  className={`theme-option ${user.theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <div className="theme-preview light-preview">
                    <div className="preview-header"></div>
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                  </div>
                  <span>Light Mode</span>
                  {user.theme === 'light' && <div className="active-dot"></div>}
                </button>
                <button 
                  className={`theme-option ${user.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <div className="theme-preview dark-preview">
                    <div className="preview-header"></div>
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                  </div>
                  <span>Dark Mode</span>
                  {user.theme === 'dark' && <div className="active-dot"></div>}
                </button>
                <button 
                  className={`theme-option ${user.theme === 'system' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('system')}
                >
                  <div className="theme-preview system-preview">
                    <span className="material-symbols-outlined">auto_mode</span>
                  </div>
                  <span>System Sync</span>
                  {user.theme === 'system' && <div className="active-dot"></div>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile