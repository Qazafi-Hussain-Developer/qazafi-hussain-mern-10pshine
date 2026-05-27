// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../services/api'

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

  // Initialize auth from localStorage/sessionStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
        const rememberMe = localStorage.getItem('rememberMe') === 'true'
        
        if (storedToken && storedUser && rememberMe) {
          setAuthToken(storedToken)
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          
          // Verify token is still valid
          try {
            const response = await api.get('/auth/verify')
            if (response.data.success) {
              setUser(response.data.user)
            } else {
              // Token invalid, clear storage
              logout()
            }
          } catch (error) {
            console.error('Token verification failed:', error)
            logout()
          }
        } else if (storedToken && storedUser) {
          // Session storage (not remembered)
          setAuthToken(storedToken)
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
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
    
    setAuthToken(authToken)
    navigate('/dashboard')
  }

  // ✅ New: Login with email/password (API call)
  const loginWithCredentials = async (email, password, rememberMe = false) => {
    try {
      setError(null)
      const response = await api.post('/auth/login', { email, password })
      
      if (response.data.success) {
        const { token, user } = response.data
        login(user, token, rememberMe)
        return { success: true, user }
      }
      return { success: false, message: response.data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ Existing signup function (kept exactly as is)
  const signup = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    navigate('/dashboard')
  }

  // ✅ New: Register user (sign up with OTP)
  const register = async (userData) => {
    try {
      setError(null)
      const response = await api.post('/auth/register', userData)
      
      if (response.data.success) {
        // Store temp data for OTP verification
        localStorage.setItem('tempEmail', userData.email)
        localStorage.setItem('tempName', userData.name)
        localStorage.setItem('tempPassword', userData.password)
        return { success: true, message: 'OTP sent to your email' }
      }
      return { success: false, message: response.data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ New: Verify OTP after signup
  const verifyOTP = async (email, otp) => {
    try {
      setError(null)
      const response = await api.post('/auth/verify-otp', { email, otp })
      
      if (response.data.success) {
        // Auto login after successful verification
        const password = localStorage.getItem('tempPassword')
        const loginResponse = await api.post('/auth/login', { email, password })
        
        if (loginResponse.data.success) {
          const { token, user } = loginResponse.data
          login(user, token, false)
          
          // Clear temp data
          localStorage.removeItem('tempEmail')
          localStorage.removeItem('tempName')
          localStorage.removeItem('tempPassword')
          
          return { success: true, user, token }
        }
      }
      return { success: false, message: response.data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ New: Resend OTP
  const resendOTP = async (email) => {
    try {
      setError(null)
      const response = await api.post('/auth/resend-otp', { email })
      return { success: response.data.success, message: response.data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ New: Forgot password - send OTP
  const forgotPassword = async (email) => {
    try {
      setError(null)
      const response = await api.post('/auth/forgot-password', { email })
      return { success: response.data.success, message: response.data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset OTP'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ New: Reset password with OTP
  const resetPassword = async (email, otp, newPassword) => {
    try {
      setError(null)
      const response = await api.post('/auth/reset-password', { email, otp, newPassword })
      return { success: response.data.success, message: response.data.message }
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed'
      setError(message)
      return { success: false, message }
    }
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
    
    setAuthToken(null)
    setToken(null)
    setUser(null)
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