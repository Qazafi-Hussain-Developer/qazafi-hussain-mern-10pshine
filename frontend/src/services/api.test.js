import axios from 'axios';
import API, { loginUser, registerUser, getNotes, createNote, updateNote, deleteNote } from '../services/api';

jest.mock('axios');
const mockedAxios = axios;

describe('API Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Auth API Tests', () => {
    test('loginUser should call correct endpoint', async () => {
      const mockResponse = { data: { token: 'test-token', user: { id: 1, name: 'Test User' } } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await loginUser({ email: 'test@example.com', password: '123456' });
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', { email: 'test@example.com', password: '123456' });
      expect(result).toEqual(mockResponse);
    });

    test('registerUser should call correct endpoint', async () => {
      const mockResponse = { data: { token: 'test-token', user: { id: 1, name: 'Test' } } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await registerUser({ name: 'Test', email: 'test@example.com', password: '123456' });
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', { name: 'Test', email: 'test@example.com', password: '123456' });
      expect(result).toEqual(mockResponse);
    });

    test('loginUser should handle error response', async () => {
      const mockError = { response: { data: { message: 'Invalid credentials' }, status: 401 } };
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(loginUser({ email: 'wrong@example.com', password: 'wrong' })).rejects.toEqual(mockError);
    });
  });

  describe('Notes API Tests', () => {
    test('getNotes should add auth token to headers', async () => {
      localStorage.setItem('token', 'test-token-123');
      mockedAxios.get.mockResolvedValue({ data: { notes: [] } });

      await getNotes();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/notes');
    });

    test('getNotes should work without token', async () => {
      mockedAxios.get.mockResolvedValue({ data: { notes: [] } });

      await getNotes();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/notes');
    });

    test('createNote should send note data with auth token', async () => {
      localStorage.setItem('token', 'test-token-123');
      const noteData = { title: 'Test Note', content: 'Test Content', category: 'Personal' };
      mockedAxios.post.mockResolvedValue({ data: { success: true, note: { id: 1, ...noteData } } });

      const result = await createNote(noteData);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/notes', noteData);
      expect(result.data).toHaveProperty('success', true);
    });

    test('updateNote should send update data to correct endpoint', async () => {
      localStorage.setItem('token', 'test-token-123');
      const noteId = 1;
      const updateData = { title: 'Updated Title', content: 'Updated Content' };
      mockedAxios.put.mockResolvedValue({ data: { success: true, note: { id: noteId, ...updateData } } });

      const result = await updateNote(noteId, updateData);
      
      expect(mockedAxios.put).toHaveBeenCalledWith(`/notes/${noteId}`, updateData);
      expect(result.data).toHaveProperty('success', true);
    });

    test('deleteNote should call delete endpoint', async () => {
      localStorage.setItem('token', 'test-token-123');
      const noteId = 1;
      mockedAxios.delete.mockResolvedValue({ data: { success: true, message: 'Note moved to trash' } });

      const result = await deleteNote(noteId);
      
      expect(mockedAxios.delete).toHaveBeenCalledWith(`/notes/${noteId}`);
      expect(result.data).toHaveProperty('success', true);
    });
  });

  describe('API Interceptor Tests', () => {
    test('should add token to request headers when token exists', async () => {
      localStorage.setItem('token', 'my-secret-token');
      
      // Get the interceptor
      const requestInterceptor = API.interceptors.request.handlers[0];
      const config = { headers: {} };
      
      const result = requestInterceptor.fulfilled(config);
      
      expect(result.headers.Authorization).toBe('Bearer my-secret-token');
    });

    test('should not add token when token does not exist', async () => {
      const requestInterceptor = API.interceptors.request.handlers[0];
      const config = { headers: {} };
      
      const result = requestInterceptor.fulfilled(config);
      
      expect(result.headers.Authorization).toBeUndefined();
    });

    test('should handle 401 response by clearing localStorage', async () => {
      localStorage.setItem('token', 'expired-token');
      localStorage.setItem('user', JSON.stringify({ name: 'Test' }));
      
      const errorResponse = {
        response: { status: 401 },
        config: {}
      };
      
      const responseInterceptor = API.interceptors.response.handlers[0];
      
      await expect(responseInterceptor.rejected(errorResponse)).rejects.toEqual(errorResponse);
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});