import { jest } from '@jest/globals';

jest.unstable_mockModule('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/reset-password' }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.unstable_mockModule('../../context/AuthContext', () => ({
  useAuth: () => ({
    resetPassword: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
const { default: ResetPassword } = await import('./ResetPassword.jsx');

describe('ResetPassword Page', () => {
  beforeEach(() => {
    localStorage.setItem('resetEmail', 'test@example.com');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders reset password page', () => {
    render(<ResetPassword />);
    expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();
  });

  test('shows email address', () => {
    render(<ResetPassword />);
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  test('has new password input', () => {
    render(<ResetPassword />);
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
  });

  test('has reset button', () => {
    render(<ResetPassword />);
    expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
  });

  test('shows error when OTP is incomplete', async () => {
    render(<ResetPassword />);
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));
    await waitFor(() => {
      expect(screen.getByText(/Please enter the 6-digit verification code/i)).toBeInTheDocument();
    });
  });
});