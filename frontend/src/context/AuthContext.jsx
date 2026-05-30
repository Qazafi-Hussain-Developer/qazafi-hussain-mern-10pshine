// frontend/src/context/AuthContext.jsx
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

  // Helper function to set auth token in localStorage/sessionStorage
  const setAuthToken = (token) => {
    if (token) {
      // Token is already stored in login function
      return
    }
  }

  // Initialize auth from localStorage/sessionStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
        
        if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          setToken(storedToken)
          try {
            const parsedUser = JSON.parse(storedUser)
            setUser(parsedUser)
            console.log('✅ Auth initialized - User:', parsedUser?.name)
          } catch (parseError) {
            console.error('Error parsing user data:', parseError)
            localStorage.removeItem('user')
            sessionStorage.removeItem('user')
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

  // ✅ Login function
  const login = (userData, authToken, rememberMe = false) => {
    console.log('🔐 Login called - User:', userData?.name)
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

  // ✅ Login with credentials (direct fetch)
  const loginWithCredentials = async (email, password, rememberMe = false) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      console.log('Login response:', data)
      
      if (data.success) {
        login(data.user, data.token, rememberMe)
        return { success: true, user: data.user }
      }
      return { success: false, message: data.message }
    } catch (error) {
      console.error('Login error:', error)
      const message = error.message || 'Login failed'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ Register user with OTP
  const register = async (userData) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password
        })
      })

      const data = await response.json()
      console.log('Register API response:', data)

      if (data.success) {
        localStorage.setItem('tempEmail', userData.email)
        localStorage.setItem('tempName', userData.name)
        localStorage.setItem('tempPassword', userData.password)
        return { success: true, message: data.message }
      } else {
        return { success: false, message: data.message || 'Registration failed' }
      }
    } catch (error) {
      console.error('Register error:', error)
      const message = error.message || 'Registration failed'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })
      
      const data = await response.json()
      console.log('Verify OTP response:', data)
      
      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        setToken(data.token)
        
        localStorage.removeItem('tempEmail')
        localStorage.removeItem('tempName')
        localStorage.removeItem('tempPassword')
        
        console.log('✅ User verified and logged in:', data.user.name)
        navigate('/dashboard')
        return { success: true, user: data.user, token: data.token }
      }
      return { success: false, message: data.message }
    } catch (error) {
      console.error('Verify OTP error:', error)
      const message = error.message || 'OTP verification failed'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ Resend OTP
  const resendOTP = async (email) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      console.log('Resend OTP response:', data)
      return { success: data.success, message: data.message }
    } catch (error) {
      console.error('Resend OTP error:', error)
      const message = error.message || 'Failed to resend OTP'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ Forgot password
  const forgotPassword = async (email) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      console.log('Forgot password response:', data)
      return { success: data.success, message: data.message }
    } catch (error) {
      console.error('Forgot password error:', error)
      const message = error.message || 'Failed to send reset OTP'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ Reset password
  const resetPassword = async (email, otp, newPassword) => {
    try {
      setError(null)
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      })
      
      const data = await response.json()
      console.log('Reset password response:', data)
      return { success: data.success, message: data.message }
    } catch (error) {
      console.error('Reset password error:', error)
      const message = error.message || 'Password reset failed'
      setError(message)
      return { success: false, message }
    }
  }

  // ✅ Signup function (kept for compatibility)
  const signup = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    navigate('/dashboard')
  }

  // ✅ Logout function
  const logout = useCallback(() => {
    console.log('🔓 Logging out...')
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

  // ✅ Update user function
  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData }
    setUser(newUserData)
    
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage
    storage.setItem('user', JSON.stringify(newUserData))
    console.log('✅ User updated:', newUserData.name)
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