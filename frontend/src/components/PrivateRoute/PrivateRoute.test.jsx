import { jest } from '@jest/globals';

const mockNavigate = jest.fn();

jest.unstable_mockModule('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Navigate: ({ to }) => <div data-testid="navigate" data-to={to}>Redirecting...</div>,
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

jest.unstable_mockModule('../../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    loading: false,
    user: { id: 1, name: 'Test User', role: 'user' },
  })),
}));

const { render, screen } = await import('@testing-library/react');
const { default: PrivateRoute } = await import('./PrivateRoute.jsx');
const { useAuth } = await import('../../context/AuthContext.jsx');

describe('PrivateRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders children when authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, loading: false, user: { id: 1 } });
    render(
      <PrivateRoute>
        <div data-testid="protected-content">Protected Content</div>
      </PrivateRoute>
    );
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('renders Outlet when authenticated and no children', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, loading: false, user: { id: 1 } });
    render(<PrivateRoute />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false, user: null });
    render(<PrivateRoute />);
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
  });

  test('redirects to custom path when specified', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false, user: null });
    render(<PrivateRoute redirectTo="/signup" />);
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/signup');
  });

  test('shows loading state', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: true, user: null });
    render(<PrivateRoute />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});