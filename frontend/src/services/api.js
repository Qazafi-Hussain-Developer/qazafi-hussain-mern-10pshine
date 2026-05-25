// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = {
  // Auth endpoints
  auth: {
    login: async (email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()
      // Store token if login successful
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      return data
    },
    
    signup: async (name, email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await response.json()
      // Store token if signup successful
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      return data
    },
    
    logout: async () => {
      const token = localStorage.getItem('token')
      try {
        // Try to call backend logout if available
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      } catch (error) {
        console.log('Logout error (non-critical):', error)
      } finally {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      return { success: true }
    },

    getProfile: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    updateProfile: async (profileData) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })
      const data = await response.json()
      // Update stored user if profile update successful
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      return data
    },

    changePassword: async (currentPassword, newPassword) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      return response.json()
    },

    uploadAvatar: async (avatarUrl) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatarUrl })
      })
      return response.json()
    }
  },

  // Notes endpoints
  notes: {
    getAll: async (params = {}) => {
      const token = localStorage.getItem('token')
      const queryString = new URLSearchParams(params).toString()
      const url = queryString ? `${API_BASE_URL}/notes?${queryString}` : `${API_BASE_URL}/notes`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },
    
    getById: async (id) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },
    
    create: async (noteData) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData)
      })
      return response.json()
    },
    
    update: async (id, noteData) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData)
      })
      return response.json()
    },
    
    delete: async (id) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    toggleFavorite: async (id) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/${id}/favorite`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    toggleArchive: async (id) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/${id}/archive`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    togglePin: async (id) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/${id}/pin`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    getTrash: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/trash`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    restore: async (id) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/${id}/restore`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    permanentDelete: async (id) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/${id}/permanent`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    getStats: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    getActivityLogs: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes/activity-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    }
  }
}

export default api