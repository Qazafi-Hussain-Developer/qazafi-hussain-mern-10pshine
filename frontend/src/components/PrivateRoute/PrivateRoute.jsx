// frontend/src/components/PrivateRoute.jsx
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * PrivateRoute Component
 * Protects routes that require authentication
 * If user is not authenticated, redirects to login page
 * 
 * Usage:
 * <Route path="/dashboard" element={<PrivateRoute />}>
 *   <Route index element={<Dashboard />} />
 * </Route>
 * 
 * OR with wrapper:
 * <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
 */

const PrivateRoute = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="private-route-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // If authenticated, render children or outlet
  return children ? children : <Outlet />
}

// Alternative: Higher-order component for wrapping components directly
export const withAuth = (Component) => {
  return (props) => (
    <PrivateRoute>
      <Component {...props} />
    </PrivateRoute>
  )
}

// Alternative: Protected Route for specific roles (if needed)
export const RoleBasedRoute = ({ children, allowedRoles, redirectTo = '/dashboard' }) => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="private-route-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return children ? children : <Outlet />
}

export default PrivateRoute