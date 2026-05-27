import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Initialize auth from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        
        if (storedToken && storedUser && storedUser !== 'undefined') {
          setToken(storedToken)
          
          // ✅ Safe JSON parsing
          try {
            const parsedUser = JSON.parse(storedUser)
            setUser(parsedUser)
          } catch (parseError) {
            console.error('Error parsing user data:', parseError)
            localStorage.removeItem('user')
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // ✅ Existing login function (kept exactly as is)
  const login = (userData, authToken, rememberMe = false) => {
    setUser(userData)
    setToken(authToken)
    
    if (rememberMe) {
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('rememberMe', 'true')
    } else {
      sessionStorage.setItem('token', authToken)
      sessionStorage.setItem('user', JSON.stringify(userData))
    }
    
    navigate('/dashboard')
  }

  // ✅ Existing signup function (kept exactly as is)
  const signup = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    navigate('/dashboard')
  }

  // ✅ Existing logout function (enhanced)
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('tempEmail')
    localStorage.removeItem('tempName')
    localStorage.removeItem('tempPassword')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setUser(null)
    setToken(null)
    setError(null)
    navigate('/login')
  }, [navigate])

  // ✅ Existing updateUser function
  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData }
    setUser(newUserData)
    
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage
    storage.setItem('user', JSON.stringify(newUserData))
  }

  // ✅ NEW: Login with credentials (API call)
  const loginWithCredentials = async (email, password, rememberMe = false) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        login(data.user, data.token, rememberMe)
        return { success: true, user: data.user }
      }
      return { success: false, message: data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ NEW: Register with OTP
  const register = async (userData) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Store temp data for OTP verification
        localStorage.setItem('tempEmail', userData.email)
        localStorage.setItem('tempName', userData.name)
        localStorage.setItem('tempPassword', userData.password)
        return { success: true, message: data.message }
      }
      return { success: false, message: data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ NEW: Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Auto login after verification
        login(data.user, data.token, false)
        
        // Clear temp data
        localStorage.removeItem('tempEmail')
        localStorage.removeItem('tempName')
        localStorage.removeItem('tempPassword')
        
        return { success: true, user: data.user, token: data.token }
      }
      return { success: false, message: data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ NEW: Resend OTP
  const resendOTP = async (email) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      return { success: data.success, message: data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ NEW: Forgot password
  const forgotPassword = async (email) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      return { success: data.success, message: data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset OTP'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ NEW: Reset password
  const resetPassword = async (email, otp, newPassword) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      })
      
      const data = await response.json()
      return { success: data.success, message: data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed'
      setError(message)
      return { success: false, message }
    }
  }

  const value = {
    // State
    user,
    token,
    loading,
    error,
    
    // Existing methods
    login,
    signup,
    logout,
    updateUser,
    
    // New methods
    loginWithCredentials,
    register,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    
    // Computed
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext