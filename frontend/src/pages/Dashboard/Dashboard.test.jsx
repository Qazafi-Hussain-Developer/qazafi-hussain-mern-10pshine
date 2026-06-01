import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import Dashboard from './Dashboard';
import { AuthProvider } from '../../context/AuthContext';

jest.mock('../../components/Layout/Sidebar', () => ({
  __esModule: true,
  default: ({ onRefresh }) => (
    <div data-testid="sidebar">
      <button onClick={onRefresh} data-testid="refresh-btn">Refresh</button>
    </div>
  ),
}));

jest.mock('../../components/Layout/TopNavbar', () => ({
  __esModule: true,
  default: ({ onSearch }) => (
    <div data-testid="top-navbar">
      <input 
        data-testid="search-input"
        onChange={(e) => onSearch(e.target.value)} 
        placeholder="Search notes..."
      />
    </div>
  ),
}));

jest.mock('../../components/Notes/NoteGrid', () => ({
  __esModule: true,
  default: ({ notes, onDelete, onEdit, onCreateNew }) => (
    <div data-testid="note-grid">
      {notes.map(note => (
        <div key={note.id} data-testid={`note-${note.id}`}>
          <h3>{note.title}</h3>
          <button onClick={() => onDelete(note.id)} data-testid={`delete-${note.id}`}>Delete</button>
        </div>
      ))}
      <button onClick={onCreateNew} data-testid="create-new-btn">Create New</button>
    </div>
  ),
}));

jest.mock('../../components/Notes/NoteList', () => ({
  __esModule: true,
  default: () => <div data-testid="note-list">Note List</div>,
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    token: 'test-token-123',
    isAuthenticated: true,
    loading: false,
  }),
  AuthProvider: ({ children }) => <>{children}</>,
}));

global.fetch = jest.fn();
global.confirm = jest.fn(() => true);

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token-123');
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test User' }));
    fetch.mockClear();
    global.confirm.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders dashboard with sidebar and top navbar', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, notes: [] }),
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('top-navbar')).toBeInTheDocument();
    });
  });

  test('displays welcome message with user name', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, notes: [] }),
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
  });

  test('handles refresh button click', async () => {
    fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, notes: [] }),
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTestId('refresh-btn');
    fireEvent.click(refreshButton);
  });

  test('handles create new note', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, notes: [] }),
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('create-new-btn')).toBeInTheDocument();
    });

    const createButton = screen.getByTestId('create-new-btn');
    fireEvent.click(createButton);
  });
});