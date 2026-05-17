import pool from '../config/db.js';
import logger, { logUserActivity } from '../utils/logger.js';

// Helper to strip HTML tags for plain content
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

// ==================== GET ALL NOTES ====================
export const getNotes = async (req, res) => {
  try {
    const { category, is_favorite, is_archived, is_pinned, search, sort_by } = req.query;
    
    let query = `
      SELECT id, title, content, plain_content, category, is_favorite, is_archived, is_pinned, color, created_at, updated_at, tags
      FROM notes 
      WHERE user_id = $1 AND is_deleted = false
    `;
    const values = [req.user.id];
    let paramCount = 2;

    if (category && category !== 'All') {
      query += ` AND category = $${paramCount++}`;
      values.push(category);
    }
    if (is_favorite === 'true') {
      query += ` AND is_favorite = true`;
    }
    if (is_archived === 'true') {
      query += ` AND is_archived = true`;
    }
    if (is_pinned === 'true') {
      query += ` AND is_pinned = true`;
    }
    if (search) {
      query += ` AND (title ILIKE $${paramCount} OR plain_content ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    switch(sort_by) {
      case 'pinned':
        query += ` ORDER BY is_pinned DESC, updated_at DESC`;
        break;
      case 'title_asc':
        query += ` ORDER BY title ASC`;
        break;
      case 'title_desc':
        query += ` ORDER BY title DESC`;
        break;
      case 'created_asc':
        query += ` ORDER BY created_at ASC`;
        break;
      case 'created_desc':
        query += ` ORDER BY created_at DESC`;
        break;
      default:
        query += ` ORDER BY updated_at DESC`;
    }

    const result = await pool.query(query, values);
    res.json({ success: true, count: result.rows.length, notes: result.rows });
  } catch (error) {
    logger.error('Get notes error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET SINGLE NOTE ====================
export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, title, content, plain_content, category, is_favorite, is_archived, is_pinned, color, created_at, updated_at, tags
       FROM notes 
       WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ success: true, note: result.rows[0] });
  } catch (error) {
    logger.error('Get note by id error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== CREATE NOTE ====================
export const createNote = async (req, res) => {
  try {
    const { title, content, category, color, tags } = req.body;
    const plainContent = stripHtml(content);
    const wordCount = plainContent.split(/\s+/).filter(w => w.length > 0).length;
    const result = await pool.query(
      `INSERT INTO notes (user_id, title, content, plain_content, category, color, tags, word_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, content, plain_content, category, is_favorite, is_archived, is_pinned, color, created_at, updated_at, tags`,
      [req.user.id, title || 'Untitled', content || '', plainContent, category || 'Personal', color || null, tags || [], wordCount]
    );
    logUserActivity(req.user.name, req.user.email, 'CREATE_NOTE', `Note created: ${title || 'Untitled'}`);
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) 
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'CREATE_NOTE', JSON.stringify({ noteId: result.rows[0].id, title: title || 'Untitled' }), req.ip]
    );
    logger.info(`Note created by user ${req.user.id}`);
    res.status(201).json({ success: true, note: result.rows[0] });
  } catch (error) {
    logger.error('Create note error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== UPDATE NOTE ====================
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, is_favorite, is_archived, is_pinned, color, tags } = req.body;
    const plainContent = content !== undefined ? stripHtml(content) : undefined;
    const wordCount = plainContent ? plainContent.split(/\s+/).filter(w => w.length > 0).length : undefined;
    const updates = [];
    const values = [];
    let paramCount = 1;
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(content);
    }
    if (plainContent !== undefined) {
      updates.push(`plain_content = $${paramCount++}`);
      values.push(plainContent);
    }
    if (wordCount !== undefined) {
      updates.push(`word_count = $${paramCount++}`);
      values.push(wordCount);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (is_favorite !== undefined) {
      updates.push(`is_favorite = $${paramCount++}`);
      values.push(is_favorite);
    }
    if (is_archived !== undefined) {
      updates.push(`is_archived = $${paramCount++}`);
      values.push(is_archived);
    }
    if (is_pinned !== undefined) {
      updates.push(`is_pinned = $${paramCount++}`);
      values.push(is_pinned);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    if (tags !== undefined) {
      updates.push(`tags = $${paramCount++}`);
      values.push(tags);
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.id);
    const query = `
      UPDATE notes 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, title, content, plain_content, category, is_favorite, is_archived, is_pinned, color, created_at, updated_at, tags
    `;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    logUserActivity(req.user.name, req.user.email, 'UPDATE_NOTE', `Note updated: ${title || 'Untitled'}`);
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) 
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'UPDATE_NOTE', JSON.stringify({ noteId: id }), req.ip]
    );
    logger.info(`Note updated: ${id}`);
    res.json({ success: true, note: result.rows[0] });
  } catch (error) {
    logger.error('Update note error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== DELETE NOTE (Soft Delete - Move to Trash) ====================
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const noteResult = await pool.query(
      'SELECT title FROM notes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (noteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    const noteTitle = noteResult.rows[0].title;
    await pool.query(
      'UPDATE notes SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    logUserActivity(req.user.name, req.user.email, 'DELETE_NOTE', `Note moved to trash: ${noteTitle}`);
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) 
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'DELETE_NOTE', JSON.stringify({ noteId: id, title: noteTitle }), req.ip]
    );
    logger.info(`Note moved to trash: ${id}`);
    res.json({ success: true, message: 'Note moved to trash' });
  } catch (error) {
    logger.error('Delete note error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET TRASHED NOTES ====================
export const getTrashedNotes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, content, category, is_favorite, is_archived, is_pinned, color, created_at, updated_at, deleted_at
       FROM notes 
       WHERE user_id = $1 AND is_deleted = true 
       ORDER BY deleted_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, count: result.rows.length, notes: result.rows });
  } catch (error) {
    logger.error('Get trashed notes error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== RESTORE NOTE FROM TRASH ====================
export const restoreNote = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notes 
       SET is_deleted = false, deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, title`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    logUserActivity(req.user.name, req.user.email, 'RESTORE_NOTE', `Note restored: ${result.rows[0].title}`);
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) 
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'RESTORE_NOTE', JSON.stringify({ noteId: id }), req.ip]
    );
    res.json({ success: true, message: 'Note restored successfully' });
  } catch (error) {
    logger.error('Restore note error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== PERMANENTLY DELETE NOTE ====================
export const permanentDeleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING title',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    logUserActivity(req.user.name, req.user.email, 'PERMANENT_DELETE_NOTE', `Note permanently deleted: ${result.rows[0].title}`);
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) 
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'PERMANENT_DELETE_NOTE', JSON.stringify({ noteId: id }), req.ip]
    );
    logger.info(`Note permanently deleted: ${id}`);
    res.json({ success: true, message: 'Note permanently deleted' });
  } catch (error) {
    logger.error('Permanent delete note error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== TOGGLE FAVORITE ====================
export const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notes 
       SET is_favorite = NOT is_favorite, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_favorite`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    const action = result.rows[0].is_favorite ? 'Added to favorites' : 'Removed from favorites';
    logUserActivity(req.user.name, req.user.email, 'TOGGLE_FAVORITE', action);
    res.json({ success: true, note: result.rows[0] });
  } catch (error) {
    logger.error('Toggle favorite error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== TOGGLE ARCHIVE ====================
export const toggleArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notes 
       SET is_archived = NOT is_archived, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_archived`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    const action = result.rows[0].is_archived ? 'Archived' : 'Unarchived';
    logUserActivity(req.user.name, req.user.email, 'TOGGLE_ARCHIVE', action);
    res.json({ success: true, note: result.rows[0] });
  } catch (error) {
    logger.error('Toggle archive error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== TOGGLE PIN ====================
export const togglePin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notes 
       SET is_pinned = NOT is_pinned, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_pinned`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    const action = result.rows[0].is_pinned ? 'Pinned to top' : 'Unpinned';
    logUserActivity(req.user.name, req.user.email, 'TOGGLE_PIN', action);
    res.json({ success: true, note: result.rows[0] });
  } catch (error) {
    logger.error('Toggle pin error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET USER STATS ====================
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalResult = await pool.query('SELECT COUNT(*) FROM notes WHERE user_id = $1 AND is_deleted = false', [userId]);
    const todayResult = await pool.query(`SELECT COUNT(*) FROM notes WHERE user_id = $1 AND is_deleted = false AND DATE(created_at) = CURRENT_DATE`, [userId]);
    const favoriteResult = await pool.query('SELECT COUNT(*) FROM notes WHERE user_id = $1 AND is_favorite = true AND is_deleted = false', [userId]);
    const pinnedResult = await pool.query('SELECT COUNT(*) FROM notes WHERE user_id = $1 AND is_pinned = true AND is_deleted = false', [userId]);
    const streakResult = await pool.query(`SELECT COUNT(DISTINCT DATE(created_at)) as streak FROM notes WHERE user_id = $1 AND is_deleted = false AND created_at > NOW() - INTERVAL '30 days'`, [userId]);
    res.json({
      success: true,
      stats: {
        total: parseInt(totalResult.rows[0].count),
        today: parseInt(todayResult.rows[0].count),
        favorites: parseInt(favoriteResult.rows[0].count),
        pinned: parseInt(pinnedResult.rows[0].count),
        streak: Math.min(parseInt(streakResult.rows[0].streak) || 1, 30)
      }
    });
  } catch (error) {
    logger.error('Get user stats error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET ACTIVITY LOGS ====================
export const getActivityLogs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT action, details, created_at, ip_address
       FROM activity_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, logs: result.rows });
  } catch (error) {
    logger.error('Get activity logs error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== COLLABORATION FUNCTIONS ====================

// Create a collaboration table (run this SQL in your database)
// CREATE TABLE IF NOT EXISTS collaborations (
//   id SERIAL PRIMARY KEY,
//   note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
//   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   invited_by INTEGER REFERENCES users(id),
//   permission VARCHAR(20) DEFAULT 'viewer',
//   status VARCHAR(20) DEFAULT 'pending',
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   UNIQUE(note_id, user_id)
// );

// ==================== GET COLLABORATORS ====================
export const getCollaborators = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, verify the user owns this note or is a collaborator
    const noteCheck = await pool.query(
      'SELECT user_id FROM notes WHERE id = $1 AND is_deleted = false',
      [id]
    );
    
    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    const isOwner = noteCheck.rows[0].user_id === req.user.id;
    
    if (!isOwner) {
      // Check if user is a collaborator
      const collabCheck = await pool.query(
        'SELECT * FROM collaborations WHERE note_id = $1 AND user_id = $2 AND status = $3',
        [id, req.user.id, 'accepted']
      );
      
      if (collabCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    // Get all collaborators for this note
    const result = await pool.query(
      `SELECT c.id, c.user_id, c.permission, c.status, c.created_at,
              u.name, u.email, u.avatar
       FROM collaborations c
       JOIN users u ON c.user_id = u.id
       WHERE c.note_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );
    
    // Get owner info
    const ownerResult = await pool.query(
      'SELECT id, name, email, avatar FROM users WHERE id = $1',
      [noteCheck.rows[0].user_id]
    );
    
    const collaborators = result.rows.map(row => ({
      id: row.user_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      permission: row.permission,
      status: row.status,
      invitedAt: row.created_at
    }));
    
    res.json({
      success: true,
      owner: ownerResult.rows[0],
      collaborators: collaborators
    });
  } catch (error) {
    logger.error('Get collaborators error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== INVITE COLLABORATOR ====================
export const inviteCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, permission = 'viewer' } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user owns the note
    const noteCheck = await pool.query(
      'SELECT user_id, title FROM notes WHERE id = $1 AND is_deleted = false',
      [id]
    );
    
    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    if (noteCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the note owner can invite collaborators' });
    }
    
    // Find the user by email
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    const invitedUser = userResult.rows[0];
    
    // Check if already a collaborator
    const existingCollab = await pool.query(
      'SELECT * FROM collaborations WHERE note_id = $1 AND user_id = $2',
      [id, invitedUser.id]
    );
    
    if (existingCollab.rows.length > 0) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }
    
    // Check if trying to invite the owner
    if (invitedUser.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }
    
    // Add collaborator
    await pool.query(
      `INSERT INTO collaborations (note_id, user_id, invited_by, permission, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, invitedUser.id, req.user.id, permission, 'accepted']
    );
    
    logUserActivity(req.user.name, req.user.email, 'INVITE_COLLABORATOR', `Invited ${email} to note: ${noteCheck.rows[0].title}`);
    
    logger.info(`User ${req.user.email} invited ${email} to note ${id}`);
    
    res.json({
      success: true,
      message: `Invitation sent to ${email}`,
      collaborator: {
        id: invitedUser.id,
        name: invitedUser.name,
        email: invitedUser.email,
        permission: permission
      }
    });
  } catch (error) {
    logger.error('Invite collaborator error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== REMOVE COLLABORATOR ====================
export const removeCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if user owns the note
    const noteCheck = await pool.query(
      'SELECT user_id, title FROM notes WHERE id = $1 AND is_deleted = false',
      [id]
    );
    
    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    if (noteCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the note owner can remove collaborators' });
    }
    
    // Remove collaborator
    const result = await pool.query(
      'DELETE FROM collaborations WHERE note_id = $1 AND user_id = $2 RETURNING user_id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }
    
    logUserActivity(req.user.name, req.user.email, 'REMOVE_COLLABORATOR', `Removed collaborator from note: ${noteCheck.rows[0].title}`);
    
    res.json({ success: true, message: 'Collaborator removed successfully' });
  } catch (error) {
    logger.error('Remove collaborator error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== UPDATE COLLABORATOR PERMISSION ====================
export const updateCollaboratorPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, permission } = req.body;
    
    if (!userId || !permission) {
      return res.status(400).json({ message: 'User ID and permission are required' });
    }
    
    if (!['viewer', 'editor', 'commenter'].includes(permission)) {
      return res.status(400).json({ message: 'Invalid permission type' });
    }
    
    // Check if user owns the note
    const noteCheck = await pool.query(
      'SELECT user_id FROM notes WHERE id = $1 AND is_deleted = false',
      [id]
    );
    
    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    if (noteCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the note owner can update permissions' });
    }
    
    await pool.query(
      'UPDATE collaborations SET permission = $1, updated_at = CURRENT_TIMESTAMP WHERE note_id = $2 AND user_id = $3',
      [permission, id, userId]
    );
    
    res.json({ success: true, message: 'Permission updated successfully' });
  } catch (error) {
    logger.error('Update collaborator permission error:', error.message);
    res.status(500).json({ message: error.message });
  }
};