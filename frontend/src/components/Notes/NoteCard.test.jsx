import { jest } from '@jest/globals';

const mockNavigate = jest.fn();

jest.unstable_mockModule('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  useNavigate: () => mockNavigate,
  Link: ({ children }) => children,
  useLocation: () => ({ pathname: '/' }),
}));

const { render, screen, fireEvent } = await import('@testing-library/react');
const { default: NoteCard } = await import('./NoteCard.jsx');

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
    is_archived: false,
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnFavorite = jest.fn();
  const mockOnArchive = jest.fn();
  const mockOnPin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders note title', () => {
    render(<NoteCard note={mockNote} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  test('renders note preview content', () => {
    render(<NoteCard note={mockNote} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('Test Content with HTML')).toBeInTheDocument();
  });

  test('renders tags', () => {
    render(<NoteCard note={mockNote} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('#React')).toBeInTheDocument();
    expect(screen.getByText('#JavaScript')).toBeInTheDocument();
  });

  test('renders category tag when category exists', () => {
    render(<NoteCard note={mockNote} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', () => {
    render(<NoteCard note={mockNote} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const editButton = screen.getByTitle('Edit');
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith(mockNote);
  });

  test('calls onDelete when delete button is clicked', () => {
    render(<NoteCard note={mockNote} onDelete={mockOnDelete} />);
    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(mockNote.id);
  });

  test('calls onFavorite when favorite button is clicked', () => {
    render(<NoteCard note={mockNote} onFavorite={mockOnFavorite} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const favoriteButton = screen.getByTitle('Add to favorites');
    fireEvent.click(favoriteButton);
    expect(mockOnFavorite).toHaveBeenCalledWith(mockNote.id);
  });

  test('calls onPin when pin button is clicked', () => {
    render(<NoteCard note={mockNote} onPin={mockOnPin} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const pinButton = screen.getByTitle('Pin to top');
    fireEvent.click(pinButton);
    expect(mockOnPin).toHaveBeenCalledWith(mockNote.id);
  });

  test('calls onArchive when archive button is clicked', () => {
    render(<NoteCard note={mockNote} onArchive={mockOnArchive} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const archiveButton = screen.getByTitle('Archive');
    fireEvent.click(archiveButton);
    expect(mockOnArchive).toHaveBeenCalledWith(mockNote.id);
  });

  test('does not show archive button when note is archived', () => {
    const archivedNote = { ...mockNote, is_archived: true };
    render(<NoteCard note={archivedNote} onArchive={mockOnArchive} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.queryByTitle('Archive')).not.toBeInTheDocument();
  });

  test('displays "Untitled" when note has no title', () => {
    const noteWithoutTitle = { ...mockNote, title: '' };
    render(<NoteCard note={noteWithoutTitle} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  test('displays "No content..." when note has no content', () => {
    const noteWithoutContent = { ...mockNote, content: '', plain_content: '' };
    render(<NoteCard note={noteWithoutContent} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('No content...')).toBeInTheDocument();
  });

  test('displays read time', () => {
    render(<NoteCard note={mockNote} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText(/min read/)).toBeInTheDocument();
  });

  test('handles missing optional props gracefully', () => {
    expect(() => {
      render(<NoteCard note={mockNote} />);
    }).not.toThrow();
  });
});