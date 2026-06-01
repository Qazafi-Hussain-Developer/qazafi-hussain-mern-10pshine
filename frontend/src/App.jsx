// src/App.jsx
import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import SignUp from './pages/SignUp/SignUp'
import Dashboard from './pages/Dashboard/Dashboard'
import NoteEditor from './pages/NoteEditor/NoteEditor'
import Profile from './pages/Profile/Profile'
import Settings from './pages/Settings/Settings'
import Trash from './pages/Trash/Trash'
import VerifyOTP from './pages/VerifyOTP/VerifyOTP'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import NotFound from './pages/NotFound/NotFound'
import PrivateRoute from './components/PrivateRoute/PrivateRoute'
import { useAuth, AuthProvider } from './context/AuthContext'
import './App.css'

// Apply theme function
const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else if (theme === 'system') {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (systemPrefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

// Protected Route Component (kept for backward compatibility)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }
  
  return user ? children : <Navigate to="/login" replace />
}

// Main App Content with Routes
const AppRoutes = () => {
  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    applyTheme(savedTheme)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme')
      if (currentTheme === 'system') {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="app">
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* ✅ NEW: Authentication Routes */}
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* ========== PROTECTED ROUTES ========== */}
        
        {/* Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Note Editor - Create New */}
        <Route 
          path="/editor/new" 
          element={
            <ProtectedRoute>
              <NoteEditor />
            </ProtectedRoute>
          } 
        />
        
        {/* Note Editor - Edit Existing */}
        <Route 
          path="/editor/:id" 
          element={
            <ProtectedRoute>
              <NoteEditor />
            </ProtectedRoute>
          } 
        />
        
        {/* Profile Page */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Settings Page */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        
        {/* Favorites Page */}
        <Route 
          path="/favorites" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Archive Page */}
        <Route 
          path="/archive" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Categories Page */}
        <Route 
          path="/categories" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Notes Page (All Notes) */}
        <Route 
          path="/notes" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Trash Page */}
        <Route 
          path="/trash" 
          element={
            <ProtectedRoute>
              <Trash />
            </ProtectedRoute>
          } 
        />
        
        {/* Notebook Routes */}
        <Route 
          path="/notebook/:notebookName" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Folder Routes */}
        <Route 
          path="/folder/:folderName" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Tag Routes */}
        <Route 
          path="/tag/:tagName" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Help Page */}
        <Route 
          path="/help" 
          element={
            <ProtectedRoute>
              <div className="coming-soon-page">
                <h1>Help & Support</h1>
                <p>Coming soon...</p>
                <button onClick={() => window.location.href = '/dashboard'}>
                  Back to Dashboard
                </button>
              </div>
            </ProtectedRoute>
          } 
        />
        
        {/* ========== 404 NOT FOUND ROUTE ========== */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

// Main App component with AuthProvider wrapper
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App