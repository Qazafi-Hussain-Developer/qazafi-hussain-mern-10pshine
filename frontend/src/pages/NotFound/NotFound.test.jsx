import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from './NotFound';

describe('NotFound Page', () => {
  test('renders 404 page', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    expect(screen.getByText(/404/i)).toBeInTheDocument();
  });

  test('renders "Page Not Found" message', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
  });

  test('has go back button', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    expect(screen.getByText(/Go Back/i)).toBeInTheDocument();
  });

  test('has go home button', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    expect(screen.getByText(/Go Home/i)).toBeInTheDocument();
  });
});