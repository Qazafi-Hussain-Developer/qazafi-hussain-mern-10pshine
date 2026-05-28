 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    forgotPassword: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

describe('ForgotPassword Page', () => {
  test('renders forgot password page', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
  });

  test('has email input', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });

  test('has send button', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /Send Reset Code/i })).toBeInTheDocument();
  });

  test('shows error when email is empty', async () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );
    const sendButton = screen.getByRole('button', { name: /Send Reset Code/i });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter your email address/i)).toBeInTheDocument();
    });
  });
});