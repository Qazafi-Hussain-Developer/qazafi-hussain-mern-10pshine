import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VerifyOTP from './VerifyOTP';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    verifyOTP: jest.fn().mockResolvedValue({ success: true }),
    resendOTP: jest.fn().mockResolvedValue({ success: true }),
    loading: false,
  }),
}));

describe('VerifyOTP Page', () => {
  beforeEach(() => {
    localStorage.setItem('tempEmail', 'test@example.com');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders verify OTP page', () => {
    render(
      <BrowserRouter>
        <VerifyOTP />
      </BrowserRouter>
    );
    expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument();
  });

  test('shows email address', () => {
    render(
      <BrowserRouter>
        <VerifyOTP />
      </BrowserRouter>
    );
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  test('has verify button', () => {
    render(
      <BrowserRouter>
        <VerifyOTP />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /Verify Email/i })).toBeInTheDocument();
  });
});