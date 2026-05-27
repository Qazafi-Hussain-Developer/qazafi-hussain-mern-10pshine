// src/__mocks__/context/AuthContext.jsx
import { jest } from '@jest/globals';
import React from 'react';

// Default mock values
const defaultMockValue = {
  login: jest.fn().mockResolvedValue({ success: true }),
  user: { name: 'John', id: 1, email: 'john@example.com' },
  token: 'test-token',
  isAuthenticated: true,
  loading: false,
  logout: jest.fn(),
};

// Mock the useAuth hook
export const useAuth = jest.fn(() => defaultMockValue);

// Mock AuthProvider component
export const AuthProvider = ({ children }) => <>{children}</>;

// Export a helper to update the mock implementation
export const __setMockAuth = (mockValue) => {
  useAuth.mockImplementation(() => ({ ...defaultMockValue, ...mockValue }));
};

// Export a helper to reset mocks
export const __resetMockAuth = () => {
  useAuth.mockReset();
  useAuth.mockImplementation(() => defaultMockValue);
};

// Default export for any wildcard imports
const mock = {
  useAuth,
  AuthProvider,
  __setMockAuth,
  __resetMockAuth,
};

export default mock;