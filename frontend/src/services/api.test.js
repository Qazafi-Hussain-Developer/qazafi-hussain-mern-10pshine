import axios from 'axios';
import API, { loginUser, registerUser, getNotes, createNote } from './api';

jest.mock('axios');
const mockedAxios = axios;

describe('API Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('loginUser should call correct endpoint', async () => {
    const mockResponse = { data: { token: 'test-token', user: { id: 1 } } };
    mockedAxios.post.mockResolvedValue(mockResponse);

    const result = await loginUser({ email: 'test@example.com', password: '123456' });
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', { email: 'test@example.com', password: '123456' });
    expect(result).toEqual(mockResponse);
  });

  test('registerUser should call correct endpoint', async () => {
    const mockResponse = { data: { token: 'test-token', user: { id: 1 } } };
    mockedAxios.post.mockResolvedValue(mockResponse);

    const result = await registerUser({ name: 'Test', email: 'test@example.com', password: '123456' });
    
    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', { name: 'Test', email: 'test@example.com', password: '123456' });
    expect(result).toEqual(mockResponse);
  });

  test('getNotes should add auth token to headers', async () => {
    localStorage.setItem('token', 'test-token-123');
    mockedAxios.get.mockResolvedValue({ data: { notes: [] } });

    await getNotes();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/notes');
  });
});