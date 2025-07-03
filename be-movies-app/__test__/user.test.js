const app = require("../app");
const request = require("supertest");
const { sequelize, User } = require("../models");
const { queryInterface } = sequelize;
const { signToken } = require("../helpers/jwt");
const { hashPassword } = require("../helpers/bcrypt");

let access_token_valid_user;
let testUserId;

beforeAll(async () => {
  // Create test users
  const testUser = await User.create({
    username: "testuser",
    email: "test@mail.com",
    password: "password123",
    preferredGenres: "Action, Comedy"
  });

  testUserId = testUser.id;
  access_token_valid_user = signToken({ id: testUser.id });
});

describe("User Authentication", () => {
  describe("POST /register", () => {
    test("Should successfully register new user", async () => {
      const newUser = {
        email: "newuser@test.com",
        password: "password123",
        username: "newuser",
        preferredGenres: "Action, Drama"
      };

      const { status, body } = await request(app)
        .post("/register")
        .send(newUser);

      expect(status).toBe(201);
      expect(body).toHaveProperty("message", "Create user success");
      expect(body.user).toHaveProperty("email", newUser.email);
      expect(body.user).not.toHaveProperty("password");
    });

    test("Should fail when email is missing", async () => {
      const { status, body } = await request(app)
        .post("/register")
        .send({
          password: "password123",
          username: "newuser"
        });

      expect(status).toBe(400);
      expect(body).toHaveProperty("message");
    });

    test("Should fail when password is missing", async () => {
      const { status, body } = await request(app)
        .post("/register")
        .send({
          email: "test2@test.com",
          username: "newuser2"
        });

      expect(status).toBe(400);
      expect(body).toHaveProperty("message");
    });

    test("Should fail when email is already registered", async () => {
      const { status, body } = await request(app)
        .post("/register")
        .send({
          email: "test@mail.com", // Already exists from beforeAll
          password: "password123",
          username: "existinguser"
        });

      expect(status).toBe(400);
      expect(body).toHaveProperty("message");
    });

    test('should validate email format', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          username: 'testuser2',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });
  });

  describe("POST /login", () => {
    test("Should successfully login", async () => {
      const { status, body } = await request(app)
        .post("/login")
        .send({
          email: "test@mail.com",
          password: "password123"
        });

      expect(status).toBe(200);
      expect(body).toHaveProperty("access_token");
      expect(body).toHaveProperty("user");
    });

    test("Should fail with invalid email", async () => {
      const { status, body } = await request(app)
        .post("/login")
        .send({
          email: "nonexistent@test.com",
          password: "password123"
        });

      expect(status).toBe(401);
      expect(body).toHaveProperty("message", "Invalid email/password");
    });

    test("Should fail with invalid password", async () => {
      const { status, body } = await request(app)
        .post("/login")
        .send({
          email: "test@mail.com",
          password: "wrongpassword"
        });

      expect(status).toBe(401);
      expect(body).toHaveProperty("message", "Invalid email/password");
    });

    test('should reject missing email', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email is required');
    });

    test('should reject missing password', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@mail.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Password is required');
    });
  });

  describe("Authentication Middleware", () => {
    test("Should fail when no token provided", async () => {
      const { status, body } = await request(app)
        .get("/user-movies");

      expect(status).toBe(401);
      expect(body).toHaveProperty("message");
    });

    test("Should fail with invalid token", async () => {
      const { status, body } = await request(app)
        .get("/user-movies")
        .set("Authorization", "Bearer invalid_token");

      expect(status).toBe(401);
      expect(body).toHaveProperty("message");
    });
  });
});

afterAll(async () => {
  await queryInterface.bulkDelete("Users", null, {
    truncate: true,
    cascade: true,
    restartIdentity: true,
  });
});
