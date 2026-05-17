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
  getCollaborators,              // ✅ Added
  inviteCollaborator,            // ✅ Added
  removeCollaborator,            // ✅ Added
  updateCollaboratorPermission,  // ✅ Added
} from '../controllers/noteController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Note CRUD routes
router.route('/')
  .get(getNotes)
  .post(createNote);

// Activity logs
router.get('/activity-logs', getActivityLogs);

// User stats
router.get('/stats', getUserStats);

// Trash routes
router.get('/trash', getTrashedNotes);
router.put('/:id/restore', restoreNote);
router.delete('/:id/permanent', permanentDeleteNote);

// Single note operations
router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

// Favorite, Archive, and Pin toggles
router.put('/:id/favorite', toggleFavorite);
router.put('/:id/archive', toggleArchive);
router.put('/:id/pin', togglePin);

// ==================== COLLABORATION ROUTES ====================
router.get('/:id/collaborators', getCollaborators);                      // Get all collaborators for a note
router.post('/:id/invite', inviteCollaborator);                          // Invite a user to collaborate
router.delete('/:id/collaborators', removeCollaborator);                 // Remove a collaborator
router.put('/:id/collaborators/permission', updateCollaboratorPermission); // Update collaborator permission

export default router;