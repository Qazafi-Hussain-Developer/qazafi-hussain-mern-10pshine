import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Layout/Sidebar'
import TopNavbar from '../../components/Layout/TopNavbar'
import './Profile.css'

const Profile = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    name: '',
    email: '',
    displayName: '',
    timezone: 'Pacific Standard Time (PST)',
    twoFactorEnabled: false,
    activeSessions: 3
  })
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    const profileData = {
      name: storedUser.name || 'Elena Rodriguez',
      email: storedUser.email || 'elena.rodriguez@designzen.com',
      displayName: storedUser.name || 'Elena Rodriguez',
      timezone: 'Pacific Standard Time (PST)',
      twoFactorEnabled: true,
      activeSessions: 3
    }
    setUser(profileData)
    setFormData(profileData)
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleUpdate = () => {
    setUser(formData)
    localStorage.setItem('user', JSON.stringify({
      name: formData.displayName,
      email: formData.email
    }))
    setIsEditing(false)
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      localStorage.clear()
      navigate('/login')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-main">
        <TopNavbar />
        <div className="profile-content">
          <div className="profile-header">
            <div className="profile-avatar-large">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAD7bMaZsJJD_R-EaWI5KVwQqV_L5y9GEKbTxOJiD-DUr5izKxioj1cWBQvGxzlbCUue94ukVAzKha0NDIYDafGyiT2zXRtcg3Cgb_wZYvguCzs6Zu_-4Xqfm2r5GkbY1jIH4gdbls1NptL8i1kQbGk-qqAXmUQpbv0t8p1OKKLoPwDvugmIzc3tpzZcmrQd8MckqRIfAUSGEcTUB7bggzEU1AP-_Fmrw_GQxBaFMxOgFCaJo2nom7zWvzF8c63XGj4JGMZH4OG3D8"
                alt="Profile"
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
          </div>

          <div className="profile-sections">
            {/* Account Settings Section */}
            <div className="profile-card">
              <h2>Account Settings</h2>
              {isEditing ? (
                <div className="profile-form">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      className="profile-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="profile-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Timezone</label>
                    <select
                      name="timezone"
                      value={formData.timezone}
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
                    <button onClick={() => setIsEditing(false)} className="cancel-update-btn">Cancel</button>
                    <button onClick={handleUpdate} className="update-btn">Update Account Information</button>
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

            {/* Security Section */}
            <div className="profile-card">
              <h2>Security</h2>
              <div className="security-item">
                <div>
                  <span className="security-label">Password</span>
                  <span className="security-description">Last changed 3 months ago</span>
                </div>
                <button className="security-btn">Change</button>
              </div>
              <div className="security-item">
                <div>
                  <span className="security-label">Two-Factor Auth</span>
                  <span className="security-description">Add an extra layer of security</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={user.twoFactorEnabled}
                    onChange={() => setUser({...user, twoFactorEnabled: !user.twoFactorEnabled})}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="security-item">
                <div>
                  <span className="security-label">Active Sessions</span>
                  <span className="security-description">{user.activeSessions} devices currently logged in</span>
                </div>
                <button className="security-btn">Manage</button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="profile-card danger-zone">
              <h2>Danger Zone</h2>
              <p>Permanently delete your account and all your note data.</p>
              <button onClick={handleDeleteAccount} className="delete-account-btn">Delete Account</button>
            </div>

            {/* Appearance Section */}
            <div className="profile-card">
              <h2>Appearance & Preferences</h2>
              <div className="theme-options">
                <button className="theme-option">
                  <span className="material-symbols-outlined">light_mode</span>
                  Light Mode
                </button>
                <button className="theme-option">
                  <span className="material-symbols-outlined">dark_mode</span>
                  Dark Mode
                </button>
                <button className="theme-option active">
                  <span className="material-symbols-outlined">sync</span>
                  System Sync
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