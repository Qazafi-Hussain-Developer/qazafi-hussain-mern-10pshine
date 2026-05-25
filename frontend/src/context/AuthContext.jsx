/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

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
  const navigate = useNavigate()

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  // Handle authentication (login and signup share logic)
  const handleAuth = useCallback((userData, authToken, redirectPath = '/') => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    navigate(redirectPath)
  }, [navigate])

  const login = useCallback((userData, authToken) => {
    handleAuth(userData, authToken, '/')
  }, [handleAuth])

  const signup = useCallback((userData, authToken) => {
    handleAuth(userData, authToken, '/')
  }, [handleAuth])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    navigate('/login')
  }, [navigate])

  // Update user (for avatar/profile updates)
  const updateUser = useCallback((updatedUserData) => {
    setUser(prevUser => {
      const newUserData = { ...prevUser, ...updatedUserData }
      localStorage.setItem('user', JSON.stringify(newUserData))
      return newUserData
    })
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    signup,
    logout,
    updateUser,
    isAuthenticated: !!user
  }), [user, token, loading, login, signup, logout, updateUser])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Add PropTypes for props validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export default AuthContext