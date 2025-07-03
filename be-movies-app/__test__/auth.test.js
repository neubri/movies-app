const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const { signToken } = require('../helpers/jwt');
const { OAuth2Client } = require('google-auth-library');

// Mock Google OAuth2Client
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn()
  }))
}));

describe('Auth Controller', () => {
  beforeEach(async () => {
    // Clean up users before each test
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await User.destroy({ where: {} });
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        preferredGenres: 'Action,Comedy'
      };

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Create user success');
      expect(res.body.user).toHaveProperty('email', userData.email);
      expect(res.body.user).toHaveProperty('username', userData.username);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('id');
      expect(res.body.user).not.toHaveProperty('createdAt');
      expect(res.body.user).not.toHaveProperty('updatedAt');
    });

    it('should handle duplicate email error', async () => {
      // Create first user
      await User.create({
        username: 'user1',
        email: 'test@example.com',
        password: 'password123'
      });

      // Try to create second user with same email
      const userData = {
        username: 'user2',
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle duplicate username error', async () => {
      // Create first user
      await User.create({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123'
      });

      // Try to create second user with same username
      const userData = {
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should validate email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should validate password length', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // Too short
      };

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should require username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should require email', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123'
      };

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('should require password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        preferredGenres: 'Action,Comedy'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/login')
        .send(loginData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('username', testUser.username);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('id');
    });

    it('should fail with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email/password');
    });

    it('should fail with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/login')
        .send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email/password');
    });

    it('should require email', async () => {
      const loginData = {
        password: 'password123'
      };

      const res = await request(app)
        .post('/login')
        .send(loginData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email is required');
    });

    it('should require password', async () => {
      const loginData = {
        email: 'test@example.com'
      };

      const res = await request(app)
        .post('/login')
        .send(loginData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password is required');
    });

    it('should reject empty email', async () => {
      const loginData = {
        email: '',
        password: 'password123'
      };

      const res = await request(app)
        .post('/login')
        .send(loginData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email is required');
    });

    it('should reject empty password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: ''
      };

      const res = await request(app)
        .post('/login')
        .send(loginData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password is required');
    });
  });

  describe('POST /google-login', () => {
    let mockVerifyIdToken;

    beforeEach(() => {
      mockVerifyIdToken = jest.fn();
      OAuth2Client.mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken
      }));
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should login with valid Google token for existing user', async () => {
      // Create existing user
      const existingUser = await User.create({
        username: 'googleuser',
        email: 'google@example.com',
        password: 'randompassword',
        preferredGenres: null
      });

      // Mock Google token verification
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'google@example.com',
          name: 'Google User'
        })
      });

      const res = await request(app)
        .post('/google-login')
        .send({
          id_token: 'valid_google_token'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('google@example.com');
      expect(res.body.message).toBe('Google login successful');
    });

    it('should create new user for new Google account', async () => {
      // Mock Google token verification for new user
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'newgoogle@example.com',
          name: 'New Google User'
        })
      });

      const res = await request(app)
        .post('/google-login')
        .send({
          id_token: 'valid_google_token'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('newgoogle@example.com');
      expect(res.body.message).toBe('Google login successful');

      // Verify user was created in database
      const createdUser = await User.findOne({ where: { email: 'newgoogle@example.com' } });
      expect(createdUser).toBeTruthy();
    });

    it('should handle username collision by adding random suffix', async () => {
      // Create existing user with username that might collide
      await User.create({
        username: 'newgoogle',
        email: 'existing@example.com',
        password: 'password123'
      });

      // Mock Google token verification
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'newgoogle@example.com',
          name: 'New Google User'
        })
      });

      const res = await request(app)
        .post('/google-login')
        .send({
          id_token: 'valid_google_token'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body.user.email).toBe('newgoogle@example.com');

      // Verify username is different from original
      const createdUser = await User.findOne({ where: { email: 'newgoogle@example.com' } });
      expect(createdUser.username).not.toBe('newgoogle');
    });

    it('should require id_token', async () => {
      const res = await request(app)
        .post('/google-login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Google ID token is required');
    });

    it('should handle invalid Google token', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const res = await request(app)
        .post('/google-login')
        .send({
          id_token: 'invalid_token'
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
    });

    it('should handle expired Google token', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Token used too late'));

      const res = await request(app)
        .post('/google-login')
        .send({
          id_token: 'expired_token'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid or expired Google token');
    });

    it('should handle missing Google client ID in environment', async () => {
      // Temporarily remove the environment variable
      const originalClientId = process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_ID;

      mockVerifyIdToken.mockRejectedValue(new Error('No client ID specified'));

      const res = await request(app)
        .post('/google-login')
        .send({
          id_token: 'valid_token'
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');

      // Restore environment variable
      process.env.GOOGLE_CLIENT_ID = originalClientId;
    });
  });
});
