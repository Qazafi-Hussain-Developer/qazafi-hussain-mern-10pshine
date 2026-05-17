import chai from 'chai';
import chaiHttp from 'chai-http';
import { expect } from 'chai';
import app from '../index.js';
import pool from '../src/config/db.js';

chai.use(chaiHttp);

describe('Notes API Tests', () => {
  let authToken = '';
  let testNoteId = '';

  // Create a test user and get token
  before(async () => {
    // Register user
    const registerRes = await chai.request(app)
      .post('/api/auth/register')
      .send({
        name: 'Note Test User',
        email: 'notetest@example.com',
        password: '123456'
      });
    
    authToken = registerRes.body.token;
  });

  describe('POST /api/notes', () => {
    it('should create a new note', (done) => {
      chai.request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Note',
          content: 'This is a test note content',
          category: 'Personal',
          tags: ['test', 'api']
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('success', true);
          expect(res.body.note).to.have.property('title', 'Test Note');
          expect(res.body.note).to.have.property('category', 'Personal');
          testNoteId = res.body.note.id;
          done();
        });
    });
  });

  describe('GET /api/notes', () => {
    it('should get all notes for user', (done) => {
      chai.request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.notes).to.be.an('array');
          done();
        });
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should get single note by id', (done) => {
      chai.request(app)
        .get(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.note).to.have.property('id', testNoteId);
          done();
        });
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update a note', (done) => {
      chai.request(app)
        .put(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Note',
          content: 'This content has been updated'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.note).to.have.property('title', 'Updated Test Note');
          done();
        });
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should soft delete a note (move to trash)', (done) => {
      chai.request(app)
        .delete(`/api/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('message', 'Note moved to trash');
          done();
        });
    });
  });

  // Clean up
  after(async () => {
    if (testNoteId) {
      await pool.query('DELETE FROM notes WHERE id = $1', [testNoteId]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', ['notetest@example.com']);
    await pool.end();
  });
});