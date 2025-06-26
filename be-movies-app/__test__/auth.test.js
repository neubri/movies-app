const request = require('supertest');
const app = require('../app');
const { User, sequelize } = require('../models');

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        favoriteGenre: 'Action'
      };

      const res = await request(app)
        .post('/register')
        .send(userData);

      expect(res.statusCode).toBe(201);
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user.name).toBe(userData.name);
      expect(res.body.user.password).toBeUndefined();
    });

    it('should not register user with duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        favoriteGenre: 'Action'
      };

      // Create first user
      await request(app).post('/register').send(userData);

      // Try to create duplicate
      const res = await request(app).post('/register').send(userData);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        favoriteGenre: 'Action'
      });
    });

    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/login')
        .send(credentials);

      expect(res.statusCode).toBe(200);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.user.email).toBe(credentials.email);
    });

    it('should not login with invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/login')
        .send(credentials);

      expect(res.statusCode).toBe(401);
    });
  });
});
