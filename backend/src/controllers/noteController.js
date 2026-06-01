import pool from '../config/db.js';
import logger, { logUserActivity } from '../utils/logger.js';
import { sendInvitationEmail } from '../services/emailService.js';

// Helper to strip HTML tags for plain content
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

// ==================== GET ALL NOTES ====================
export const getNotes = async (req, res) => {
  try {
    const { category, is_favorite, is_archived, is_pinned, search, sort_by, folder_id } = req.query;
    
    let query = `
      SELECT n.id, n.title, n.content, n.plain_content, n.category, n.is_favorite, n.is_archived, n.is_pinned, n.color, n.created_at, n.updated_at, n.tags, n.folder_id,
             f.name as folder_name, f.icon as folder_icon, f.color as folder_color
      FROM notes n
      LEFT JOIN folders f ON n.folder_id = f.id
      WHERE n.user_id = $1 AND n.is_deleted = false
    `;
    const values = [req.user.id];
    let paramCount = 2;

    if (folder_id === 'null') {
      query += ` AND n.folder_id IS NULL`;
    } else if (folder_id) {
      query += ` AND n.folder_id = $${paramCount++}`;
      values.push(folder_id);
    }
    if (category && category !== 'All') {
      query += ` AND n.category = $${paramCount++}`;
      values.push(category);
    }
    if (is_favorite === 'true') {
      query += ` AND n.is_favorite = true`;
    }
    if (is_archived === 'true') {
      query += ` AND n.is_archived = true`;
    }
    if (is_pinned === 'true') {
      query += ` AND n.is_pinned = true`;
    }
    if (search) {
      query += ` AND (n.title ILIKE $${paramCount} OR n.plain_content ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    switch(sort_by) {
      case 'pinned':
        query += ` ORDER BY n.is_pinned DESC, n.updated_at DESC`;
        break;
      case 'title_asc':
        query += ` ORDER BY n.title ASC`;
        break;
      case 'title_desc':
        query += ` ORDER BY n.title DESC`;
        break;
      case 'created_asc':
        query += ` ORDER BY n.created_at ASC`;
        break;
      case 'created_desc':
        query += ` ORDER BY n.created_at DESC`;
        break;
      default:
        query += ` ORDER BY n.updated_at DESC`;
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
      `SELECT n.id, n.title, n.content, n.plain_content, n.category, n.is_favorite, n.is_archived, n.is_pinned, n.color, n.created_at, n.updated_at, n.tags, n.folder_id,
              f.name as folder_name
       FROM notes n
       LEFT JOIN folders f ON n.folder_id = f.id
       WHERE n.id = $1 AND n.user_id = $2 AND n.is_deleted = false`,
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
    const { title, content, category, color, tags, folder_id } = req.body;
    const plainContent = stripHtml(content);
    const wordCount = plainContent.split(/\s+/).filter(w => w.length > 0).length;
    const result = await pool.query(
      `INSERT INTO notes (user_id, title, content, plain_content, category, color, tags, word_count, folder_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title, content, plain_content, category, is_favorite, is_archived, is_pinned, color, created_at, updated_at, tags, folder_id`,
      [req.user.id, title || 'Untitled', content || '', plainContent, category || 'Personal', color || null, tags || [], wordCount, folder_id || null]
    );
    
    // Update folder note count
    if (folder_id) {
      await pool.query(
        `UPDATE folders SET note_count = (
          SELECT COUNT(*) FROM notes WHERE folder_id = $1 AND is_deleted = false
        ) WHERE id = $1`,
        [folder_id]
      );
    }
    
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
    const { title, content, category, is_favorite, is_archived, is_pinned, color, tags, folder_id } = req.body;
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
    if (folder_id !== undefined) {
      updates.push(`folder_id = $${paramCount++}`);
      values.push(folder_id === 'null' ? null : folder_id);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.id);
    const query = `
      UPDATE notes 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, title, content, plain_content, category, is_favorite, is_archived, is_pinned, color, created_at, updated_at, tags, folder_id
    `;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Update folder note counts
    await pool.query(
      `UPDATE folders SET note_count = (
        SELECT COUNT(*) FROM notes WHERE folder_id = folders.id AND is_deleted = false
      ) WHERE user_id = $1`,
      [req.user.id]
    );
    
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
      'SELECT title, folder_id FROM notes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (noteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    const noteTitle = noteResult.rows[0].title;
    const folderId = noteResult.rows[0].folder_id;
    
    await pool.query(
      'UPDATE notes SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    // Update folder note count
    if (folderId) {
      await pool.query(
        `UPDATE folders SET note_count = (
          SELECT COUNT(*) FROM notes WHERE folder_id = $1 AND is_deleted = false
        ) WHERE id = $1`,
        [folderId]
      );
    }
    
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
      `SELECT id, title, content, category, is_favorite, is_archived, is_pinned, color, created_at, updated_at, deleted_at, folder_id
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
       RETURNING id, title, folder_id`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Update folder note count
    if (result.rows[0].folder_id) {
      await pool.query(
        `UPDATE folders SET note_count = (
          SELECT COUNT(*) FROM notes WHERE folder_id = $1 AND is_deleted = false
        ) WHERE id = $1`,
        [result.rows[0].folder_id]
      );
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
      'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING title, folder_id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Update folder note count
    if (result.rows[0].folder_id) {
      await pool.query(
        `UPDATE folders SET note_count = (
          SELECT COUNT(*) FROM notes WHERE folder_id = $1 AND is_deleted = false
        ) WHERE id = $1`,
        [result.rows[0].folder_id]
      );
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
    const foldersResult = await pool.query('SELECT COUNT(*) FROM folders WHERE user_id = $1', [userId]);
    
    res.json({
      success: true,
      stats: {
        total: parseInt(totalResult.rows[0].count),
        today: parseInt(todayResult.rows[0].count),
        favorites: parseInt(favoriteResult.rows[0].count),
        pinned: parseInt(pinnedResult.rows[0].count),
        streak: Math.min(parseInt(streakResult.rows[0].streak) || 1, 30),
        folders: parseInt(foldersResult.rows[0].count)
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

// ==================== GET DASHBOARD STATS (Enhanced) ====================
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const countsResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_favorite = true THEN 1 ELSE 0 END) as favorites,
        SUM(CASE WHEN is_pinned = true THEN 1 ELSE 0 END) as pinned,
        SUM(CASE WHEN is_archived = true THEN 1 ELSE 0 END) as archived,
        SUM(CASE WHEN is_deleted = true THEN 1 ELSE 0 END) as trash,
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) as today
       FROM notes 
       WHERE user_id = $1`,
      [userId]
    );
    
    const categoriesResult = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM notes 
       WHERE user_id = $1 AND is_deleted = false
       GROUP BY category
       ORDER BY count DESC`,
      [userId]
    );
    
    const activityResult = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM notes 
       WHERE user_id = $1 AND is_deleted = false AND created_at > NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    );
    
    const foldersResult = await pool.query(
      'SELECT COUNT(*) as folder_count FROM folders WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      stats: {
        totalNotes: parseInt(countsResult.rows[0].total),
        favorites: parseInt(countsResult.rows[0].favorites),
        pinned: parseInt(countsResult.rows[0].pinned),
        archived: parseInt(countsResult.rows[0].archived),
        trash: parseInt(countsResult.rows[0].trash),
        notesToday: parseInt(countsResult.rows[0].today),
        categories: categoriesResult.rows,
        weeklyActivity: activityResult.rows,
        folders: parseInt(foldersResult.rows[0].folder_count)
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET NOTEBOOKS (Categories with counts) ====================
export const getNotebooks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM notes 
       WHERE user_id = $1 AND is_deleted = false
       GROUP BY category
       ORDER BY count DESC`,
      [userId]
    );
    
    res.json({ success: true, notebooks: result.rows });
  } catch (error) {
    logger.error('Get notebooks error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET TAGS (All unique tags with counts) ====================
export const getTags = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT tag, COUNT(*) as count
       FROM (
         SELECT UNNEST(tags) as tag
         FROM notes 
         WHERE user_id = $1 AND is_deleted = false AND tags IS NOT NULL AND array_length(tags, 1) > 0
       ) as tag_list
       GROUP BY tag
       ORDER BY count DESC`,
      [userId]
    );
    
    res.json({ success: true, tags: result.rows });
  } catch (error) {
    logger.error('Get tags error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== FOLDER FUNCTIONS ====================

// Get all folders for user
export const getFolders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT id, name, icon, color, parent_id, note_count, created_at, updated_at
       FROM folders 
       WHERE user_id = $1
       ORDER BY name ASC`,
      [userId]
    );
    
    // Get folder hierarchy
    const folders = result.rows;
    const folderMap = {};
    const rootFolders = [];
    
    folders.forEach(folder => {
      folderMap[folder.id] = { ...folder, children: [] };
    });
    
    folders.forEach(folder => {
      if (folder.parent_id && folderMap[folder.parent_id]) {
        folderMap[folder.parent_id].children.push(folderMap[folder.id]);
      } else {
        rootFolders.push(folderMap[folder.id]);
      }
    });
    
    res.json({ success: true, folders: rootFolders, flatFolders: folders });
  } catch (error) {
    logger.error('Get folders error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Create a new folder
export const createFolder = async (req, res) => {
  try {
    const { name, icon, color, parent_id } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }
    
    // Check if folder already exists
    const existing = await pool.query(
      'SELECT id FROM folders WHERE user_id = $1 AND name = $2',
      [userId, name]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Folder already exists' });
    }
    
    const result = await pool.query(
      `INSERT INTO folders (user_id, name, icon, color, parent_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, icon, color, parent_id, note_count, created_at`,
      [userId, name, icon || '📁', color || '#a78bfa', parent_id || null]
    );
    
    logUserActivity(req.user.name, req.user.email, 'CREATE_FOLDER', `Folder created: ${name}`);
    
    res.status(201).json({ success: true, folder: result.rows[0] });
  } catch (error) {
    logger.error('Create folder error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update folder
export const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;
    const userId = req.user.id;
    
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(icon);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);
    
    const result = await pool.query(
      `UPDATE folders SET ${updates.join(', ')} 
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING id, name, icon, color, parent_id, note_count, created_at`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    logUserActivity(req.user.name, req.user.email, 'UPDATE_FOLDER', `Folder updated: ${result.rows[0].name}`);
    
    res.json({ success: true, folder: result.rows[0] });
  } catch (error) {
    logger.error('Update folder error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Delete folder
export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get folder name first
    const folderResult = await pool.query(
      'SELECT name FROM folders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (folderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    const folderName = folderResult.rows[0].name;
    
    // Move notes to uncategorized (folder_id = NULL) before deleting folder
    await pool.query(
      'UPDATE notes SET folder_id = NULL WHERE folder_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    // Delete subfolders recursively
    await pool.query(
      'DELETE FROM folders WHERE id = $1 OR parent_id = $1',
      [id]
    );
    
    logUserActivity(req.user.name, req.user.email, 'DELETE_FOLDER', `Folder deleted: ${folderName}`);
    
    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    logger.error('Delete folder error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// Move note to folder
export const moveNoteToFolder = async (req, res) => {
  try {
    const { id } = req.params; // note id
    const { folderId } = req.body;
    const userId = req.user.id;
    
    const result = await pool.query(
      'UPDATE notes SET folder_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING id',
      [folderId === 'null' ? null : folderId, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Update folder note counts
    await pool.query(
      `UPDATE folders SET note_count = (
        SELECT COUNT(*) FROM notes WHERE folder_id = folders.id AND is_deleted = false
      ) WHERE user_id = $1`,
      [userId]
    );
    
    res.json({ success: true, message: 'Note moved successfully' });
  } catch (error) {
    logger.error('Move note to folder error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== COLLABORATION FUNCTIONS ====================

// ==================== GET COLLABORATORS ====================
export const getCollaborators = async (req, res) => {
  try {
    const { id } = req.params;
    
    const noteCheck = await pool.query(
      'SELECT user_id FROM notes WHERE id = $1 AND is_deleted = false',
      [id]
    );
    
    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    const isOwner = noteCheck.rows[0].user_id === req.user.id;
    
    if (!isOwner) {
      const collabCheck = await pool.query(
        'SELECT * FROM collaborations WHERE note_id = $1 AND user_id = $2 AND status = $3',
        [id, req.user.id, 'accepted']
      );
      
      if (collabCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    const result = await pool.query(
      `SELECT c.id, c.user_id, c.permission, c.status, c.created_at,
              u.name, u.email, u.avatar
       FROM collaborations c
       JOIN users u ON c.user_id = u.id
       WHERE c.note_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );
    
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

// ==================== INVITE COLLABORATOR (UPDATED WITH EMAIL) ====================
export const inviteCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, permission = 'viewer' } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
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
    
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    const invitedUser = userResult.rows[0];
    
    const existingCollab = await pool.query(
      'SELECT * FROM collaborations WHERE note_id = $1 AND user_id = $2',
      [id, invitedUser.id]
    );
    
    if (existingCollab.rows.length > 0) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }
    
    if (invitedUser.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }
    
    await pool.query(
      `INSERT INTO collaborations (note_id, user_id, invited_by, permission, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, invitedUser.id, req.user.id, permission, 'accepted']
    );
    
    // ✅ SEND INVITATION EMAIL
    try {
      await sendInvitationEmail(
        invitedUser.email,
        req.user.name,
        noteCheck.rows[0].title,
        id
      );
      console.log(`📧 Invitation email sent to: ${invitedUser.email}`);
    } catch (emailError) {
      console.error('⚠️ Failed to send invitation email:', emailError.message);
      // Don't block the invitation if email fails
    }
    
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