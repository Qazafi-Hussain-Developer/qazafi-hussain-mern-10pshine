import { jest } from '@jest/globals';
import { api } from './api';

global.fetch = jest.fn();

describe('API Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('loginUser should call correct endpoint', async () => {
    fetch.mockResolvedValue({ json: () => ({ token: 'test-token', user: { id: 1 } }) });

    await api.auth.login('test@example.com', '123456');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('registerUser should call correct endpoint', async () => {
    fetch.mockResolvedValue({ json: () => ({ token: 'test-token', user: { id: 1 } }) });

    await api.auth.signup('Test', 'test@example.com', '123456');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('getNotes should include auth token in headers', async () => {
    localStorage.setItem('token', 'test-token-123');
    fetch.mockResolvedValue({ json: () => ({ notes: [] }) });

    await api.notes.getAll();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'Authorization': 'Bearer test-token-123' })
      })
    );
  });

  test('createNote should post note data', async () => {
    localStorage.setItem('token', 'test-token-123');
    fetch.mockResolvedValue({ json: () => ({ id: 1, title: 'Test' }) });

    await api.notes.create({ title: 'Test', content: 'Hello' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});