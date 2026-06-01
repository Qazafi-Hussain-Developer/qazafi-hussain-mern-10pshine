import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NoteList from './NoteList';

const mockNotes = [
  { id: '1', title: 'Note 1', content: 'Content 1' },
  { id: '2', title: 'Note 2', content: 'Content 2' },
];

describe('NoteList Component', () => {
  test('renders list of notes', () => {
    render(
      <BrowserRouter>
        <NoteList notes={mockNotes} />
      </BrowserRouter>
    );
    expect(screen.getByText('Note 1')).toBeInTheDocument();
    expect(screen.getByText('Note 2')).toBeInTheDocument();
  });
});