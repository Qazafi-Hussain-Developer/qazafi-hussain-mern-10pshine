// src/pages/Dashboard/Dashboard.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import Dashboard from './Dashboard';
import { AuthProvider } from '../../context/AuthContext';

// Mock all child components
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
  default: ({ notes, onDelete, onEdit, onFavorite, onArchive, onPin, onCreateNew }) => (
    <div data-testid="note-grid">
      {notes.map(note => (
        <div key={note.id} data-testid={`note-${note.id}`}>
          <h3>{note.title}</h3>
          <button onClick={() => onEdit(note)} data-testid={`edit-${note.id}`}>Edit</button>
          <button onClick={() => onDelete(note.id)} data-testid={`delete-${note.id}`}>Delete</button>
          <button onClick={() => onFavorite(note.id)} data-testid={`favorite-${note.id}`}>Favorite</button>
          <button onClick={() => onArchive(note.id)} data-testid={`archive-${note.id}`}>Archive</button>
          <button onClick={() => onPin(note.id)} data-testid={`pin-${note.id}`}>Pin</button>
        </div>
      ))}
      <button onClick={onCreateNew} data-testid="create-new-btn">Create New</button>
    </div>
  ),
}));

jest.mock('../../components/Notes/NoteList', () => ({
  __esModule: true,
  default: ({ notes, onDelete, onEdit, onFavorite, onArchive, onPin }) => (
    <div data-testid="note-list">
      {notes.map(note => (
        <div key={note.id} data-testid={`note-list-${note.id}`}>
          <h3>{note.title}</h3>
          <button onClick={() => onEdit(note)}>Edit</button>
          <button onClick={() => onDelete(note.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

// Mock useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    token: 'test-token-123',
    isAuthenticated: true,
    loading: false,
  }),
  AuthProvider: ({ children }) => <>{children}</>,
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.confirm
global.confirm = jest.fn(() => true);

// Helper function to render with providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
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
      expect(screen.getByText(/Good/i)).toBeInTheDocument();
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });
  });

  test('displays stats cards', async () => {
    const mockNotes = [
      { _id: '1', title: 'Note 1', content: 'Content 1', created_at: new Date().toISOString() },
      { _id: '2', title: 'Note 2', content: 'Content 2', created_at: new Date().toISOString() },
    ];

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, notes: mockNotes }),
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Notes')).toBeInTheDocument();
      expect(screen.getByText('Notes Today')).toBeInTheDocument();
      expect(screen.getByText('Favorites')).toBeInTheDocument();
      expect(screen.getByText('Pinned')).toBeInTheDocument();
    });
  });

  test('fetches and displays notes', async () => {
    const mockNotes = [
      { 
        _id: '1', 
        title: 'Test Note 1', 
        content: 'Content 1', 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false,
        is_archived: false,
        is_pinned: false
      },
      { 
        _id: '2', 
        title: 'Test Note 2', 
        content: 'Content 2', 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false,
        is_archived: false,
        is_pinned: false
      },
    ];

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, notes: mockNotes }),
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('note-grid')).toBeInTheDocument();
    });
  });

  test('handles search functionality', async () => {
    const mockNotes = [
      { 
        _id: '1', 
        title: 'Important Meeting', 
        content: 'Meeting notes',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false,
        is_archived: false,
        is_pinned: false
      },
      { 
        _id: '2', 
        title: 'Shopping List', 
        content: 'Groceries',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false,
        is_archived: false,
        is_pinned: false
      },
    ];

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, notes: mockNotes }),
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('note-grid')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Meeting' } });
  });

  test('handles note deletion', async () => {
    const mockNotes = [
      { 
        _id: '1', 
        title: 'Note to Delete', 
        content: 'Content',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false,
        is_archived: false,
        is_pinned: false
      },
    ];

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, notes: mockNotes }),
      })
    );

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, message: 'Note deleted successfully' }),
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('note-1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId('delete-1');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
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

    // Should fetch notes again
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
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

  test('displays error message when fetch fails', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ success: false, message: 'Failed to fetch notes' }),
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch notes/i)).toBeInTheDocument();
    });
  });

  test('displays loading state', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<Dashboard />);

    expect(screen.getByText(/Loading your notes/i)).toBeInTheDocument();
  });

  test('shows empty state when no notes', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, notes: [] }),
      })
    );

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/No notes yet/i)).toBeInTheDocument();
    });
  });
});