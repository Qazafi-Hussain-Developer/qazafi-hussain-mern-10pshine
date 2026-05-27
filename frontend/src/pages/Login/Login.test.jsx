// src/pages/Login/Login.test.jsx
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Login from './Login';

// Mock the useAuth hook
const mockLogin = jest.fn();
const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    loading: false,
  }),
  AuthProvider: ({ children }) => <>{children}</>,
}));

// Mock fetch globally
global.fetch = jest.fn();

// Helper function to render with providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockLogin.mockClear();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  test('renders login form', () => {
    renderWithProviders(<Login />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders Lavender Notes title', () => {
    renderWithProviders(<Login />);
    // Use getAllByText and check first one, or use a more specific selector
    const titles = screen.getAllByText(/Lavender Notes/i);
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0]).toBeInTheDocument();
  });

  test('renders sign up link', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/New to Lavender Notes\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
  });

  test('updates email field when typed into', () => {
    renderWithProviders(<Login />);
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  test('updates password field when typed into', () => {
    renderWithProviders(<Login />);
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });

  test('shows error when submitting empty form', async () => {
    renderWithProviders(<Login />);
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);
    
    // Check for error message - case insensitive
    await waitFor(() => {
      const errorElement = screen.getByText(/please enter email and password/i);
      expect(errorElement).toBeInTheDocument();
    });
  });

  test('shows error when only email is provided', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);
    
    await waitFor(() => {
      const errorElement = screen.getByText(/please enter email and password/i);
      expect(errorElement).toBeInTheDocument();
    });
  });

  test('shows error when only password is provided', async () => {
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);
    
    await waitFor(() => {
      const errorElement = screen.getByText(/please enter email and password/i);
      expect(errorElement).toBeInTheDocument();
    });
  });

  test('calls login API on successful login', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ 
        success: true, 
        user: { id: 1, email: 'test@example.com', name: 'Test User' }, 
        token: 'abc123' 
      }),
    };
    fetch.mockImplementationOnce(() => Promise.resolve(mockResponse));

    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );
    });
  });

  test('calls login function from AuthContext on successful login', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ 
        success: true, 
        user: { id: 1, email: 'test@example.com', name: 'Test User' }, 
        token: 'abc123' 
      }),
    };
    fetch.mockImplementationOnce(() => Promise.resolve(mockResponse));

    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { id: 1, email: 'test@example.com', name: 'Test User' },
        'abc123'
      );
    });
  });

  test('navigates to dashboard on successful login', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ 
        success: true, 
        user: { id: 1, email: 'test@example.com', name: 'Test User' }, 
        token: 'abc123' 
      }),
    };
    fetch.mockImplementationOnce(() => Promise.resolve(mockResponse));

    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('shows error message on failed login', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({ 
        success: false, 
        message: 'Invalid email or password' 
      }),
    };
    fetch.mockImplementationOnce(() => Promise.resolve(mockResponse));

    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  test('shows server error when backend is not reachable', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument();
    });
  });

  test('disables form inputs while loading', async () => {
    // Create a promise that never resolves to keep loading state
    fetch.mockImplementationOnce(() => new Promise(() => {}));

    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(signInButton).toBeDisabled();
      expect(screen.getByText(/signing in\.\.\./i)).toBeInTheDocument();
    });
  });

  test('shows forgot password link', () => {
    renderWithProviders(<Login />);
    const forgotLink = screen.getByText(/forgot\?/i);
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink.closest('a')).toHaveAttribute('href', '#');
  });

  test('renders social login buttons', () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Apple/i)).toBeInTheDocument();
  });

  test('handles social login click', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    renderWithProviders(<Login />);
    
    const googleButton = screen.getByText(/Google/i);
    fireEvent.click(googleButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Login with Google');
    consoleSpy.mockRestore();
  });
});