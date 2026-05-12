// Authentication helper functions
export const auth = {
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  },

  getToken: () => {
    return localStorage.getItem('token')
  },

  getUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  setSession: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },

  clearSession: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getAuthHeader: () => {
    const token = localStorage.getItem('token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
}

export default auth