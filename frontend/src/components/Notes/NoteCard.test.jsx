import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NoteCard from './NoteCard';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('NoteCard Component', () => {
  const mockNote = {
    id: '1',
    title: 'Test Note',
    content: '<p>This is test content</p>',
    plain_content: 'This is test content',
    category: 'Personal',
    is_favorite: false,
    is_archived: false,
    is_pinned: false,
    tags: ['test', 'demo'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockProps = {
    note: mockNote,
    onDelete: jest.fn(),
    onEdit: jest.fn(),
    onFavorite: jest.fn(),
    onArchive: jest.fn(),
    onPin: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <NoteCard {...mockProps} />
      </BrowserRouter>
    );
  };

  test('renders note title', () => {
    renderComponent();
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  test('renders note preview content', () => {
    renderComponent();
    expect(screen.getByText('This is test content')).toBeInTheDocument();
  });

  test('calls onPin when pin button is clicked', () => {
    renderComponent();
    const pinButton = screen.getByTitle('Pin to top');
    fireEvent.click(pinButton);
    expect(mockProps.onPin).toHaveBeenCalledWith('1');
  });

  test('calls onFavorite when favorite button is clicked', () => {
    renderComponent();
    const favButton = screen.getByTitle('Add to favorites');
    fireEvent.click(favButton);
    expect(mockProps.onFavorite).toHaveBeenCalledWith('1');
  });

  test('calls onDelete when delete button is clicked', () => {
    renderComponent();
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);
    expect(mockProps.onDelete).toHaveBeenCalledWith('1');
  });

  test('navigates to editor when note is clicked', () => {
    renderComponent();
    const noteCard = screen.getByText('Test Note').closest('.note-card');
    fireEvent.click(noteCard);
    expect(mockNavigate).toHaveBeenCalledWith('/editor/1');
  });
});