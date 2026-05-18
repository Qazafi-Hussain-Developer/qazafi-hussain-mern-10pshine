import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getProfile, 
  updateProfile, 
  logoutUser,
  changePassword,
  uploadAvatar
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/avatar', protect, uploadAvatar);

export default router;


import {
  // ... existing imports
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorPermission,
} from '../controllers/noteController.js';

// Collaboration routes
router.get('/:id/collaborators', getCollaborators);
router.post('/:id/invite', inviteCollaborator);
router.delete('/:id/collaborators', removeCollaborator);
router.put('/:id/collaborators/permission', updateCollaboratorPermission);