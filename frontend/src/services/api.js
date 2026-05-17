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
      return response.json()
    },
    // ✅ Fix: Change from /auth/signup to /auth/register
    signup: async (name, email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      return response.json()
    },
    // ✅ Fix: Remove logout if backend doesn't have it
    logout: async () => {
      const token = localStorage.getItem('token')
      // Optional: Call backend logout if you have it
      // const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${token}` }
      // })
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { success: true }
    }
  },

  // Notes endpoints
  notes: {
    getAll: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/notes`, {
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
    }
  },

  // User endpoints
  user: {
    // ✅ Fix: Change from /user/profile to /auth/profile
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
      return response.json()
    }
  }
}

export default api