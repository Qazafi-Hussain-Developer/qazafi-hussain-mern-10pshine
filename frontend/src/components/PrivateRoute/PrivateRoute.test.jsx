// frontend/src/components/PrivateRoute/PrivateRoute.test.jsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

// Mock the useAuth hook
const mockUseAuth = jest.fn();

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('PrivateRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    render(
      <BrowserRouter>
        <PrivateRoute>
          <div data-testid="protected-content">Protected Content</div>
        </PrivateRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/protected" element={
            <PrivateRoute>
              <div>Protected Content</div>
            </PrivateRoute>
          } />
        </Routes>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </BrowserRouter>
    );

    // Should redirect to login
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('shows loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true,
    });

    render(
      <BrowserRouter>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  test('accepts custom redirect path', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/custom-login" element={<div data-testid="custom-login">Custom Login</div>} />
        </Routes>
        <PrivateRoute redirectTo="/custom-login">
          <div>Protected Content</div>
        </PrivateRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('custom-login')).toBeInTheDocument();
  });
});