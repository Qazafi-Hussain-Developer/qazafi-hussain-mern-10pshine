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
    signup: async (name, email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      return response.json()
    },
    logout: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
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
    getProfile: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },
    updateProfile: async (profileData) => {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
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