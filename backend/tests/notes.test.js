import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';
import pool from '../src/config/db.js';

describe('Notes API Tests', () => {
  let authToken = '';
  let testNoteId = '';

  before(async () => {
    try {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Note Test User', email: 'notetest@example.com', password: '123456' });
      authToken = res.body.token;
    } catch (err) {
      console.error('Setup error:', err.message);
    }
  });

  after(async () => {
    try {
      if (testNoteId) {
        await pool.query('DELETE FROM notes WHERE id = $1', [testNoteId]);
      }
      await pool.query('DELETE FROM users WHERE email = $1', ['notetest@example.com']);
    } catch (err) {
      console.error('Cleanup error:', err.message);
    }
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Note', content: 'This is a test note content', category: 'Personal' });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.note).to.have.property('title', 'Test Note');
      expect(res.body.note).to.have.property('category', 'Personal');
      testNoteId = res.body.note.id;
    });
  });

  describe('GET /api/notes', () => {
    it('should get all notes for user', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.notes).to.be.an('array');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should get single note by id', async () => {
      const res = await request(app)
        .get(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.note).to.have.property('id', testNoteId);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update a note', async () => {
      const res = await request(app)
        .put(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Test Note', content: 'This content has been updated' });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.note).to.have.property('title', 'Updated Test Note');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should soft delete a note (move to trash)', async () => {
      const res = await request(app)
        .delete(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message', 'Note moved to trash');
    });
  });
});
