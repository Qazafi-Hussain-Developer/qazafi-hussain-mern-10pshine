// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import SignUp from './pages/SignUp/SignUp'
import Dashboard from './pages/Dashboard/Dashboard'
import NoteEditor from './pages/NoteEditor/NoteEditor'
import Profile from './pages/Profile/Profile'
import Settings from './pages/Settings/Settings'
import Trash from './pages/Trash/Trash'
import VerifyOTP from './pages/VerifyOTP/VerifyOTP'           // ✅ NEW
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'  // ✅ NEW
import ResetPassword from './pages/ResetPassword/ResetPassword'    // ✅ NEW
import NotFound from './pages/NotFound/NotFound'              // ✅ NEW - 404 Page
import PrivateRoute from './components/PrivateRoute/PrivateRoute'  // ✅ NEW
import { useAuth, AuthProvider } from './context/AuthContext'
import './App.css'

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
        <Route path="*" element={<NotFound />} />  {/* ✅ Shows 404 page instead of redirect */}
      </Routes>
    </div>
  )
}

// Main App component with AuthProvider wrapper
// ✅ CORRECT - Self-closing
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App