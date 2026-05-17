import chai from 'chai';
import chaiHttp from 'chai-http';
import { expect } from 'chai';
import app from '../index.js';
import pool from '../src/config/db.js';

chai.use(chaiHttp);

describe('Authentication API Tests', () => {
  let testToken = '';
  let testUserId = '';

  // Clean up before tests
  before(async () => {
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%test%@example.com']);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', (done) => {
      chai.request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123456'
        })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('success', true);
          expect(res.body.user).to.have.property('name', 'Test User');
          expect(res.body.user).to.have.property('email', 'test@example.com');
          expect(res.body).to.have.property('token');
          testToken = res.body.token;
          testUserId = res.body.user.id;
          done();
        });
    });

    it('should not register user with existing email', (done) => {
      chai.request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email: 'test@example.com',
          password: '123456'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message', 'User already exists');
          done();
        });
    });

    it('should not register user with short password', (done) => {
      chai.request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'short@example.com',
          password: '123'
        })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('message', 'Password must be at least 6 characters');
          done();
        });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login existing user', (done) => {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '123456'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.user).to.have.property('email', 'test@example.com');
          expect(res.body).to.have.property('token');
          done();
        });
    });

    it('should not login with wrong password', (done) => {
      chai.request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message', 'Invalid email or password');
          done();
        });
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', (done) => {
      chai.request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('success', true);
          expect(res.body.user).to.have.property('name', 'Test User');
          done();
        });
    });

    it('should not get profile without token', (done) => {
      chai.request(app)
        .get('/api/auth/profile')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  // Clean up after tests
  after(async () => {
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.end();
  });
});