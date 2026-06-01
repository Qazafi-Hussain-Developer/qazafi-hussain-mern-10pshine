import { jest } from '@jest/globals';

const mockNavigate = jest.fn();

jest.unstable_mockModule('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.unstable_mockModule('../../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

const { render, screen, fireEvent } = await import('@testing-library/react');
const { default: NotFound } = await import('./NotFound.jsx');

describe('NotFound Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders 404 page', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  test('renders page not found message', () => {
    render(<NotFound />);
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
  });

  test('renders go back button', () => {
    render(<NotFound />);
    expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument();
  });

  test('renders go home button', () => {
    render(<NotFound />);
    expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument();
  });

  test('navigates back when go back is clicked', () => {
    render(<NotFound />);
    fireEvent.click(screen.getByRole('button', { name: /Go Back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('navigates to login when go home is clicked and not authenticated', () => {
    render(<NotFound />);
    fireEvent.click(screen.getByRole('button', { name: /Go Home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});