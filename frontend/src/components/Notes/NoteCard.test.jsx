// src/components/Notes/NoteCard.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import NoteCard from './NoteCard';

// Mock the navigate function
const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NoteCard Component', () => {
  const mockNote = {
    id: '1',
    _id: '1',
    title: 'Test Note',
    content: '<p>Test Content with HTML</p>',
    plain_content: 'Test Content with HTML',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['React', 'JavaScript'],
    category: 'Personal',
    is_favorite: false,
    is_pinned: false,
    is_archived: false
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnFavorite = jest.fn();
  const mockOnArchive = jest.fn();
  const mockOnPin = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
    mockOnFavorite.mockClear();
    mockOnArchive.mockClear();
    mockOnPin.mockClear();
  });

  test('renders note title', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  test('renders note preview content', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('Test Content with HTML')).toBeInTheDocument();
  });

  test('renders tags', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('#React')).toBeInTheDocument();
    expect(screen.getByText('#JavaScript')).toBeInTheDocument();
  });

  test('renders category tag when category exists', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    const editButton = screen.getByTitle('Edit');
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith(mockNote);
  });

  test('calls onDelete when delete button is clicked', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onDelete={mockOnDelete}
      />
    );
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(mockNote.id);
  });

  test('navigates to editor when card is clicked', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    const card = screen.getByText('Test Note').closest('.note-card');
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith(`/editor/${mockNote.id}`);
  });

  test('calls onFavorite when favorite button is clicked', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onFavorite={mockOnFavorite}
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    const favoriteButton = screen.getByTitle('Add to favorites');
    fireEvent.click(favoriteButton);
    expect(mockOnFavorite).toHaveBeenCalledWith(mockNote.id);
  });

  test('shows active favorite state when note is favorited', () => {
    const favoritedNote = { ...mockNote, is_favorite: true };
    renderWithRouter(
      <NoteCard 
        note={favoritedNote} 
        onFavorite={mockOnFavorite}
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    const favoriteButton = screen.getByTitle('Remove from favorites');
    expect(favoriteButton).toBeInTheDocument();
  });

  test('calls onPin when pin button is clicked', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onPin={mockOnPin}
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    const pinButton = screen.getByTitle('Pin to top');
    fireEvent.click(pinButton);
    expect(mockOnPin).toHaveBeenCalledWith(mockNote.id);
  });

  test('shows active pin state when note is pinned', () => {
    const pinnedNote = { ...mockNote, is_pinned: true };
    renderWithRouter(
      <NoteCard 
        note={pinnedNote} 
        onPin={mockOnPin}
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    const pinButton = screen.getByTitle('Unpin');
    expect(pinButton).toBeInTheDocument();
  });

  test('calls onArchive when archive button is clicked', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onArchive={mockOnArchive}
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    const archiveButton = screen.getByTitle('Archive');
    fireEvent.click(archiveButton);
    expect(mockOnArchive).toHaveBeenCalledWith(mockNote.id);
  });

  test('does not show archive button when note is archived', () => {
    const archivedNote = { ...mockNote, is_archived: true };
    renderWithRouter(
      <NoteCard 
        note={archivedNote} 
        onArchive={mockOnArchive}
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    const archiveButton = screen.queryByTitle('Archive');
    expect(archiveButton).not.toBeInTheDocument();
  });

  test('displays "Untitled" when note has no title', () => {
    const noteWithoutTitle = { ...mockNote, title: '' };
    renderWithRouter(
      <NoteCard 
        note={noteWithoutTitle} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  test('displays "No content..." when note has no content', () => {
    const noteWithoutContent = { ...mockNote, content: '', plain_content: '' };
    renderWithRouter(
      <NoteCard 
        note={noteWithoutContent} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText('No content...')).toBeInTheDocument();
  });

  test('displays read time', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText(/min read/)).toBeInTheDocument();
  });

  test('displays formatted date', () => {
    renderWithRouter(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete}
      />
    );
    expect(screen.getByText(/ago|Just now/)).toBeInTheDocument();
  });

  test('prevents event propagation when clicking action buttons', () => {
    const cardClickMock = jest.fn();
    renderWithRouter(
      <div onClick={cardClickMock}>
        <NoteCard 
          note={mockNote} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete}
        />
      </div>
    );
    
    const editButton = screen.getByTitle('Edit');
    fireEvent.click(editButton);
    expect(cardClickMock).not.toHaveBeenCalled();
    
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);
    expect(cardClickMock).not.toHaveBeenCalled();
  });

  test('handles missing optional props gracefully', () => {
    // Test with only required props
    expect(() => {
      renderWithRouter(
        <NoteCard note={mockNote} />
      );
    }).not.toThrow();
    
    // Should still render basic content
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });
});