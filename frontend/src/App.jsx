import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import SignUp from './pages/SignUp/SignUp'
import Dashboard from './pages/Dashboard/Dashboard'
import NoteEditor from './pages/NoteEditor/NoteEditor'
import Profile from './pages/Profile/Profile'

function App() {
  const isAuthenticated = localStorage.getItem('token')

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route 
        path="/" 
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/editor" 
        element={isAuthenticated ? <NoteEditor /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/editor/:id" 
        element={isAuthenticated ? <NoteEditor /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/profile" 
        element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
      />
    </Routes>
  )
}

export default App