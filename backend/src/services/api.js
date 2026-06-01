import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ============================================
// AUTH APIs (Existing + New)
// ============================================
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getProfile = () => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const logoutUser = () => API.post('/auth/logout');
export const changePassword = (data) => API.put('/auth/change-password', data);
export const uploadAvatar = (data) => API.post('/auth/avatar', data);
export const deleteAccount = () => API.delete('/auth/delete-account');

// ============================================
// OTP & VERIFICATION APIs (NEW)
// ============================================
export const verifyOTP = (data) => API.post('/auth/verify-otp', data);
export const resendOTP = (data) => API.post('/auth/resend-otp', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);
export const sendOTP = (data) => API.post('/auth/send-otp', data);
export const toggleTwoFactor = (data) => API.put('/auth/two-factor', data);

// ============================================
// USER PREFERENCES APIs (NEW)
// ============================================
export const getUserPreferences = () => API.get('/auth/preferences');
export const updateTimezone = (data) => API.put('/auth/timezone', data);
export const updateFontSize = (data) => API.put('/auth/font-size', data);
export const updateNotifications = (data) => API.put('/auth/notifications', data);
export const updateEditorPreferences = (data) => API.put('/auth/editor-preferences', data);
export const updatePrivacySettings = (data) => API.put('/auth/privacy', data);
export const getActiveSessions = () => API.get('/auth/sessions');
export const getUserStats = () => API.get('/auth/stats');

// ============================================
// NOTE APIs (Existing)
// ============================================
export const getNotes = (params) => API.get('/notes', { params });
export const getNoteById = (id) => API.get(`/notes/${id}`);
export const createNote = (data) => API.post('/notes', data);
export const updateNote = (id, data) => API.put(`/notes/${id}`, data);
export const deleteNote = (id) => API.delete(`/notes/${id}`);

// ============================================
// NOTE ACTIONS APIs (NEW)
// ============================================
export const toggleFavorite = (id) => API.put(`/notes/${id}/favorite`);
export const toggleArchive = (id) => API.put(`/notes/${id}/archive`);
export const togglePin = (id) => API.put(`/notes/${id}/pin`);
export const restoreNote = (id) => API.put(`/notes/${id}/restore`);
export const permanentDeleteNote = (id) => API.delete(`/notes/${id}/permanent`);

// ============================================
// TRASH APIs (NEW)
// ============================================
export const getTrashedNotes = () => API.get('/notes/trash');

// ============================================
// NOTEBOOKS (CATEGORIES) APIs (NEW)
// ============================================
export const getNotebooks = () => API.get('/notes/notebooks');
export const createNotebook = (data) => API.post('/notes/notebooks', data);
export const updateNotebook = (id, data) => API.put(`/notes/notebooks/${id}`, data);
export const deleteNotebook = (id) => API.delete(`/notes/notebooks/${id}`);

// ============================================
// TAGS APIs (NEW)
// ============================================
export const getTags = () => API.get('/notes/tags');
export const createTag = (data) => API.post('/notes/tags', data);
export const deleteTag = (tagName) => API.delete(`/notes/tags/${tagName}`);

// ============================================
// FOLDERS APIs (NEW)
// ============================================
export const getFolders = () => API.get('/notes/folders');
export const createFolder = (data) => API.post('/notes/folders', data);
export const updateFolder = (id, data) => API.put(`/notes/folders/${id}`, data);
export const deleteFolder = (id) => API.delete(`/notes/folders/${id}`);
export const moveNoteToFolder = (noteId, data) => API.put(`/notes/${noteId}/move`, data);

// ============================================
// COLLABORATION APIs (NEW)
// ============================================
export const getCollaborators = (noteId) => API.get(`/notes/${noteId}/collaborators`);
export const inviteCollaborator = (noteId, data) => API.post(`/notes/${noteId}/invite`, data);
export const removeCollaborator = (noteId, data) => API.delete(`/notes/${noteId}/collaborators`, { data });
export const updateCollaboratorPermission = (noteId, data) => API.put(`/notes/${noteId}/collaborators/permission`, data);

// ============================================
// INVITATION EMAIL API (NEW)
// ============================================
export const sendInvitationEmail = (data) => API.post('/auth/send-invitation-email', data);

// ============================================
// ACTIVITY & STATS APIs (NEW)
// ============================================
export const getActivityLogs = () => API.get('/notes/activity-logs');
export const getDashboardStats = () => API.get('/notes/dashboard-stats');

// ============================================
// VERIFY TOKEN API (NEW)
// ============================================
export const verifyToken = () => API.get('/auth/verify');

// Default export
export default API;