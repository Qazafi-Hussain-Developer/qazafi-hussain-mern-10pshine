import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  toggleFavorite,
  toggleArchive,
  getActivityLogs,
  getTrashedNotes,
  restoreNote,
  permanentDeleteNote,
  togglePin,
  getUserStats,
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorPermission,
  getNotebooks,
  getTags,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  moveNoteToFolder,
  getDashboardStats
} from '../controllers/noteController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== NOTE CRUD ROUTES ====================
router.route('/')
  .get(getNotes)
  .post(createNote);

// ==================== ACTIVITY & STATS ROUTES ====================
router.get('/activity-logs', getActivityLogs);
router.get('/stats', getUserStats);
router.get('/dashboard-stats', getDashboardStats);

// ==================== TRASH ROUTES ====================
router.get('/trash', getTrashedNotes);
router.put('/:id/restore', restoreNote);
router.delete('/:id/permanent', permanentDeleteNote);

// ==================== SINGLE NOTE OPERATIONS ====================
router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

// ==================== NOTE ACTIONS (Favorite, Archive, Pin) ====================
router.put('/:id/favorite', toggleFavorite);
router.put('/:id/archive', toggleArchive);
router.put('/:id/pin', togglePin);

// ==================== NOTEBOOKS & TAGS ROUTES ====================
router.get('/notebooks', getNotebooks);
router.get('/tags', getTags);

// ==================== FOLDER ROUTES ====================
router.get('/folders', getFolders);
router.post('/folders', createFolder);
router.put('/folders/:id', updateFolder);
router.delete('/folders/:id', deleteFolder);
router.put('/notes/:id/move', moveNoteToFolder);

// ==================== COLLABORATION ROUTES ====================
router.get('/:id/collaborators', getCollaborators);
router.post('/:id/invite', inviteCollaborator);
router.delete('/:id/collaborators', removeCollaborator);
router.put('/:id/collaborators/permission', updateCollaboratorPermission);

export default router;