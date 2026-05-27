// src/setupTests.js
import { jest, beforeAll, afterAll } from '@jest/globals';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Make jest available globally
global.jest = jest;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Suppress console errors during tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  console.error = (...args) => {
    // Skip specific React warnings
    if (args.length > 0 && typeof args[0] === 'string') {
      if (
        args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: useLayoutEffect does nothing on the server') ||
        args[0].includes('React.jsx: type is invalid') ||
        args[0].includes('Signup error:') ||
        args[0].includes('Login error:') ||
        args[0].includes('Network error')
      ) {
        return;
      }
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (args.length > 0 && typeof args[0] === 'string') {
      if (args[0].includes('ReactDOM.render')) {
        return;
      }
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});