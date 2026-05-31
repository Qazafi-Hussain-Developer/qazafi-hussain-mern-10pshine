
// frontend/src/context/AuthContext.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

// Test component that uses useAuth hook
const TestComponent = () => {
  const { user, token, loading, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <button onClick={() => login({ name: 'Test User' }, 'test-token', false)} data-testid="login-btn">
        Login
      </button>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

// Mock fetch
global.fetch = jest.fn();

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test('provides initial auth state', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
  });

  test('useAuth throws error when used outside AuthProvider', () => {
    // Suppress console error for this test
    const consoleError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(
        <BrowserRouter>
          <TestComponent />
        </BrowserRouter>
      );
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = consoleError;
  });

  test('login stores user data in localStorage when rememberMe is true', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    const loginBtn = screen.getByTestId('login-btn');
    loginBtn.click();

    expect(localStorage.getItem('token')).toBe('test-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify({ name: 'Test User' }));
    expect(localStorage.getItem('rememberMe')).toBe('true');
  });

  test('login stores user data in sessionStorage when rememberMe is false', () => {
    // Create a custom component with rememberMe=false
    const TestComponentWithRememberMe = () => {
      const { login } = useAuth();
      return (
        <button onClick={() => login({ name: 'Test User' }, 'test-token', false)} data-testid="login-btn">
          Login
        </button>
      );
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponentWithRememberMe />
        </AuthProvider>
      </BrowserRouter>
    );

    const loginBtn = screen.getByTestId('login-btn');
    loginBtn.click();

    expect(sessionStorage.getItem('token')).toBe('test-token');
    expect(sessionStorage.getItem('user')).toBe(JSON.stringify({ name: 'Test User' }));
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('logout clears all storage', () => {
    // First login to set data
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Test User' }));
    localStorage.setItem('rememberMe', 'true');

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    const logoutBtn = screen.getByTestId('logout-btn');
    logoutBtn.click();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('rememberMe')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });

  test('updateUser updates user data in state and storage', () => {
    // Create component with updateUser
    const UpdateUserComponent = () => {
      const { user, updateUser } = useAuth();
      return (
        <div>
          <div data-testid="user-name">{user?.name || 'null'}</div>
          <button onClick={() => updateUser({ name: 'Updated Name' })} data-testid="update-btn">
            Update
          </button>
        </div>
      );
    };

    // Set initial user in localStorage
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Original Name' }));

    render(
      <BrowserRouter>
        <AuthProvider>
          <UpdateUserComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('user-name')).toHaveTextContent('Original Name');

    const updateBtn = screen.getByTestId('update-btn');
    updateBtn.click();

    expect(screen.getByTestId('user-name')).toHaveTextContent('Updated Name');
    expect(JSON.parse(localStorage.getItem('user')).name).toBe('Updated Name');
  });
});