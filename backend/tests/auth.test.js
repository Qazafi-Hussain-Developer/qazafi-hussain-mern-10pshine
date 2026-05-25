import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';
import pool from '../src/config/db.js';

describe('Authentication API Tests', () => {
  let testToken = '';
  let testUserId = '';

  before(async () => {
    try {
      await pool.query('DELETE FROM users WHERE email LIKE $1', ['%test%@example.com']);
    } catch (err) {
      console.error('Cleanup error:', err.message);
    }
  });

  after(async () => {
    try {
      if (testUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    } catch (err) {
      console.error('Cleanup error:', err.message);
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: '123456' });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.user).to.have.property('name', 'Test User');
      expect(res.body.user).to.have.property('email', 'test@example.com');
      expect(res.body).to.have.property('token');
      testToken = res.body.token;
      testUserId = res.body.user.id;
    });

    it('should not register user with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User 2', email: 'test@example.com', password: '123456' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'User already exists');
    });

    it('should not register user with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'short@example.com', password: '123' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Password must be at least 6 characters');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: '123456' });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.user).to.have.property('email', 'test@example.com');
      expect(res.body).to.have.property('token');
    });

    it('should not login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('message', 'Invalid email or password');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.user).to.have.property('name', 'Test User');
    });

    it('should not get profile without token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).to.equal(401);
    });
  });
});
