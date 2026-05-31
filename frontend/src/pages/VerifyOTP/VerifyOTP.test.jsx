import { jest } from '@jest/globals';

jest.unstable_mockModule('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/verify-otp' }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.unstable_mockModule('../../context/AuthContext', () => ({
  useAuth: () => ({
    verifyOTP: jest.fn().mockResolvedValue({ success: true }),
    resendOTP: jest.fn().mockResolvedValue({ success: true }),
    loading: false,
  }),
}));

const { render, screen } = await import('@testing-library/react');
const { default: VerifyOTP } = await import('./VerifyOTP.jsx');

describe('VerifyOTP Page', () => {
  beforeEach(() => {
    localStorage.setItem('tempEmail', 'test@example.com');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders verify OTP page', () => {
    render(<VerifyOTP />);
    expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument();
  });

  test('shows email address', () => {
    render(<VerifyOTP />);
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  test('has verify button', () => {
    render(<VerifyOTP />);
    expect(screen.getByRole('button', { name: /Verify Email/i })).toBeInTheDocument();
  });
});