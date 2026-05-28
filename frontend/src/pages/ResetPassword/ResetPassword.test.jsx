import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    resetPassword: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

describe('ResetPassword Page', () => {
  beforeEach(() => {
    localStorage.setItem('resetEmail', 'test@example.com');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders reset password page', () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );
    expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();
  });

  test('has OTP inputs', () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );
    const otpInputs = document.querySelectorAll('.otp-input');
    expect(otpInputs.length).toBe(6);
  });

  test('has password input', () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
  });
});