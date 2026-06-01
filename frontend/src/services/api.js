// frontend/src/services/api.js
// Base API configuration
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api'

// Token management
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token)
    sessionStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
  }
}

export const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

// Helper function for authenticated requests
const authFetch = async (url, options = {}) => {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  })
  return response
}

export const api = {
  // Auth endpoints
  auth: {
    // ✅ Existing login (kept exactly the same)
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

    // ✅ Existing signup (kept exactly the same)
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

    // ✅ Existing logout (kept exactly the same)
    logout: async () => {
      const token = getAuthToken()
      try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('rememberMe')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        return data
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('rememberMe')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        return { success: true }
      }
    },

    // ✅ NEW: Register with OTP (sends verification email)
    register: async (userData) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      return response.json()
    },

    // ✅ NEW: Verify OTP after signup
    verifyOTP: async (email, otp) => {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })
      return response.json()
    },

    // ✅ NEW: Resend OTP
    resendOTP: async (email) => {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      return response.json()
    },

    // ✅ NEW: Forgot password - send OTP to email
    forgotPassword: async (email) => {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      return response.json()
    },

    // ✅ NEW: Reset password with OTP
    resetPassword: async (email, otp, newPassword) => {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      })
      return response.json()
    },

    // ✅ NEW: Verify token validity
    verifyToken: async () => {
      const token = getAuthToken()
      if (!token) return { success: false }
      
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    // ✅ NEW: Refresh token
    refreshToken: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include' // For httpOnly cookie refresh token
      })
      return response.json()
    }
  },

  // Notes endpoints (kept exactly the same, just added authFetch alternative)
  notes: {
    getAll: async () => {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },
    
    getById: async (id) => {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },
    
    create: async (noteData) => {
      const token = getAuthToken()
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
      const token = getAuthToken()
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
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    // ✅ NEW: Favorite note
    favorite: async (id) => {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/notes/${id}/favorite`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    // ✅ NEW: Archive note
    archive: async (id) => {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/notes/${id}/archive`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },

    // ✅ NEW: Pin note
    pin: async (id) => {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/notes/${id}/pin`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    }
  },

  // User endpoints
  user: {
    getProfile: async () => {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    },
    
    updateProfile: async (profileData) => {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
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
    },

    // ✅ NEW: Change password
    changePassword: async (currentPassword, newPassword) => {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      return response.json()
    },

    // ✅ NEW: Delete account
    deleteAccount: async () => {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.json()
    }
  }
}

// ✅ NEW: Axios-like instance for authenticated requests
export const authenticatedApi = {
  get: async (url) => {
    const response = await authFetch(url)
    return response.json()
  },
  post: async (url, data) => {
    const response = await authFetch(url, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return response.json()
  },
  put: async (url, data) => {
    const response = await authFetch(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return response.json()
  },
  delete: async (url) => {
    const response = await authFetch(url, {
      method: 'DELETE'
    })
    return response.json()
  }
}

export default api