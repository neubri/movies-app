const app = require("../app");
const request = require("supertest");
const { sequelize, User } = require("../models");
const { queryInterface } = sequelize;

const { signToken } = require("../helpers/jwt");
const { hashPassword } = require("../helpers/bcrypt");

let access_token_valid;

beforeAll(async () => {
  //seeding untuk users
  const users = require("../data/users.json").map((el) => {
    el.createdAt = el.updatedAt = new Date();
    el.password = hashPassword(el.password);
    return el;
  });

  await queryInterface.bulkInsert("Users", users);

  //skema user
  const user = await User.findOne({ where: { email: "admin@h84.com" } });
  access_token_valid = signToken({ id: user.id });
});

describe("Register", () => {
  describe("Berhasil register dan mengirimkan user data", () => {
    test("Should return status 201 and user object", async () => {
      let { status, body } = await request(app).post("/register").send({
        name: "New User",
        email: "newuser@h84.com",
        password: "newuser123",
        favoriteGenre: "Horror"
      });

      expect(status).toBe(201);
      expect(body).toHaveProperty("user");
      expect(body.user).toHaveProperty("id", expect.any(Number));
      expect(body.user).toHaveProperty("name", "New User");
      expect(body.user).toHaveProperty("email", "newuser@h84.com");
      expect(body.user).toHaveProperty("favoriteGenre", "Horror");
      expect(body.user).not.toHaveProperty("password");
    });
  });

  describe("Name tidak diberikan / tidak diinput", () => {
    test("Should return status 400 when name is empty", async () => {
      let { status, body } = await request(app).post("/register").send({
        name: "",
        email: "test@h84.com",
        password: "test123456",
        favoriteGenre: "Action"
      });

      expect(status).toBe(400);
      expect(body).not.toHaveProperty("name");
      expect(body).toHaveProperty("message", "Name is required");
    });
  });

  describe("Email tidak diberikan / tidak diinput", () => {
    test("Should return status 400 when email is empty", async () => {
      let { status, body } = await request(app).post("/register").send({
        name: "Test User",
        email: "",
        password: "test123456",
        favoriteGenre: "Action"
      });

      expect(status).toBe(400);
      expect(body).not.toHaveProperty("email");
      expect(body).toHaveProperty("message", "Email is required");
    });
  });

  describe("Password tidak diberikan / tidak diinput", () => {
    test("Should return status 400 when password is empty", async () => {
      let { status, body } = await request(app).post("/register").send({
        name: "Test User",
        email: "test@h84.com",
        password: "",
        favoriteGenre: "Action"
      });

      expect(status).toBe(400);
      expect(body).not.toHaveProperty("password");
      expect(body).toHaveProperty("message", "Password is required");
    });
  });

  describe("Favorite Genre tidak diberikan / tidak diinput", () => {
    test("Should return status 400 when favoriteGenre is empty", async () => {
      let { status, body } = await request(app).post("/register").send({
        name: "Test User",
        email: "test@h84.com",
        password: "test123456",
        favoriteGenre: ""
      });

      expect(status).toBe(400);
      expect(body).not.toHaveProperty("favoriteGenre");
      expect(body).toHaveProperty("message", "Favorite genre is required");
    });
  });

  describe("Email sudah terdaftar", () => {
    test("Should return status 400 when email already exists", async () => {
      let { status, body } = await request(app).post("/register").send({
        name: "Duplicate User",
        email: "admin@h84.com",
        password: "duplicate123",
        favoriteGenre: "Action"
      });

      expect(status).toBe(400);
      expect(body).toHaveProperty("message", "Email already exists");
    });
  });
});

describe("Login", () => {
  describe("Berhasil login dan mengirimkan access_token", () => {
    test("Should return status 200 and access token", async () => {
      let { status, body } = await request(app).post("/login").send({
        email: "admin@h84.com",
        password: "admin123456",
      });

      expect(status).toBe(200);
      expect(body).toHaveProperty("access_token", expect.any(String));
      expect(body).toHaveProperty("user");
      expect(body.user).toHaveProperty("email", "admin@h84.com");
      expect(body.user).not.toHaveProperty("password");
    });
  });

  describe("Email tidak diberikan / tidak diinput", () => {
    test("Should return status 400 when email is empty", async () => {
      let { status, body } = await request(app).post("/login").send({
        email: "",
        password: "admin123456",
      });

      expect(status).toBe(400);
      expect(body).not.toHaveProperty("email");
      expect(body).toHaveProperty("message", "Email is required");
    });
  });

  describe("Password tidak diberikan / tidak diinput", () => {
    test("Should return status 400 when password is empty", async () => {
      let { status, body } = await request(app).post("/login").send({
        email: "admin@h84.com",
        password: "",
      });

      expect(status).toBe(400);
      expect(body).not.toHaveProperty("password");
      expect(body).toHaveProperty("message", "Password is required");
    });
  });

  describe("Email diberikan invalid / tidak terdaftar", () => {
    test("Should return status 401 and message Invalid email/password", async () => {
      let { status, body } = await request(app).post("/login").send({
        email: "notfound@h84.com",
        password: "admin123456",
      });

      expect(status).toBe(401);
      expect(body).toHaveProperty("message", "Invalid email/password");
    });
  });

  describe("Password diberikan salah / tidak match", () => {
    test("Should return status 401 and message Invalid email/password", async () => {
      let { status, body } = await request(app).post("/login").send({
        email: "admin@h84.com",
        password: "wrongpassword",
      });

      expect(status).toBe(401);
      expect(body).toHaveProperty("message", "Invalid email/password");
    });
  });
});

describe("Get Me", () => {
  describe("Berhasil mendapatkan user yang sedang login", () => {
    test("Should return status 200 and user object", async () => {
      let { status, body } = await request(app)
        .get("/me")
        .set("Authorization", `Bearer ${access_token_valid}`);

      expect(status).toBe(200);
      expect(body).toHaveProperty("user");
      expect(body.user).toHaveProperty("id", expect.any(Number));
      expect(body.user).toHaveProperty("email", "admin@h84.com");
      expect(body.user).not.toHaveProperty("password");
    });
  });

  describe("Gagal mendapatkan user karena belum login", () => {
    test("Should return status 401 and Invalid Token", async () => {
      let { status, body } = await request(app).get("/me");

      expect(status).toBe(401);
      expect(body).toHaveProperty("message", "Invalid Token");
    });
  });
});

describe("Update Profile", () => {
  describe("Berhasil mengupdate profile user", () => {
    test("Should return status 200 and updated user", async () => {
      let { status, body } = await request(app)
        .put("/profile")
        .send({
          name: "Updated Admin",
          favoriteGenre: "Science Fiction"
        })
        .set("Authorization", `Bearer ${access_token_valid}`);

      expect(status).toBe(200);
      expect(body).toHaveProperty("user");
      expect(body.user).toHaveProperty("name", "Updated Admin");
      expect(body.user).toHaveProperty("favoriteGenre", "Science Fiction");
      expect(body).toHaveProperty("message", "Profile updated successfully");
    });
  });

  describe("Gagal mengupdate profile karena belum login", () => {
    test("Should return status 401 and Invalid Token", async () => {
      let { status, body } = await request(app)
        .put("/profile")
        .send({
          name: "Updated Name"
        });

      expect(status).toBe(401);
      expect(body).toHaveProperty("message", "Invalid Token");
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
