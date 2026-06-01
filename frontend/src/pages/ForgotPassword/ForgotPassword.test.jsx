import { jest } from '@jest/globals';

jest.unstable_mockModule('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/forgot-password' }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.unstable_mockModule('../../context/AuthContext', () => ({
  useAuth: () => ({
    forgotPassword: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
const { default: ForgotPassword } = await import('./ForgotPassword.jsx');

describe('ForgotPassword Page', () => {
  test('renders forgot password page', () => {
    render(<ForgotPassword />);
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
  });

  test('has email input', () => {
    render(<ForgotPassword />);
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });

  test('has send button', () => {
    render(<ForgotPassword />);
    expect(screen.getByRole('button', { name: /Send Reset Code/i })).toBeInTheDocument();
  });

  test('shows error when email is empty', async () => {
    render(<ForgotPassword />);
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Code/i }));
    await waitFor(() => {
      expect(screen.getByText(/Please enter your email address/i)).toBeInTheDocument();
    });
  });
});