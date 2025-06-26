const app = require("../app");
const request = require("supertest");
const { sequelize, User, Movie } = require("../models");
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

  //seeding untuk movies
  const movies = require("../data/movies.json").map((el) => {
    el.createdAt = el.updatedAt = new Date();
    return el;
  });

  await queryInterface.bulkInsert("Users", users);
  await queryInterface.bulkInsert("Movies", movies);

  //skema user
  const user = await User.findOne({ where: { email: "admin@h84.com" } });
  access_token_valid = signToken({ id: user.id });
});

describe("Get Movies", () => {
  describe("Berhasil mendapatkan semua movie tanpa query parameter", () => {
    test("Should return status 200 and array of movies", async () => {
      let { status, body } = await request(app).get("/movies");

      expect(status).toBe(200);
      expect(body).toHaveProperty("movies", expect.any(Array));
      expect(body).toHaveProperty("pagination");
      expect(body.movies[0]).toHaveProperty("id", expect.any(Number));
      expect(body.movies[0]).toHaveProperty("title", expect.any(String));
      expect(body.movies[0]).toHaveProperty("overview", expect.any(String));
      expect(body.movies[0]).toHaveProperty("genres", expect.any(Array));
    });
  });

  describe("Berhasil mendapatkan movie dengan filter genre", () => {
    test("Should return status 200 and filtered movies", async () => {
      let { status, body } = await request(app).get("/movies?filter=Action");

      expect(status).toBe(200);
      expect(body).toHaveProperty("movies", expect.any(Array));
      expect(body.movies.length).toBeGreaterThan(0);
      expect(body.movies[0].genres).toContain("Action");
    });
  });

  describe("Berhasil mendapatkan movie dengan search parameter", () => {
    test("Should return status 200 and searched movies", async () => {
      let { status, body } = await request(app).get("/movies?search=Action");

      expect(status).toBe(200);
      expect(body).toHaveProperty("movies", expect.any(Array));
    });
  });

  describe("Berhasil mendapatkan movie dengan pagination", () => {
    test("Should return status 200 with pagination", async () => {
      let { status, body } = await request(app).get("/movies?page[size]=2&page[number]=1");

      expect(status).toBe(200);
      expect(body).toHaveProperty("movies", expect.any(Array));
      expect(body.movies.length).toBeLessThanOrEqual(2);
      expect(body).toHaveProperty("pagination");
      expect(body.pagination).toHaveProperty("currentPage", 1);
    });
  });

  describe("Berhasil mendapatkan movie dengan sorting", () => {
    test("Should return status 200 with sorted movies", async () => {
      let { status, body } = await request(app).get("/movies?sort=-voteAverage");

      expect(status).toBe(200);
      expect(body).toHaveProperty("movies", expect.any(Array));
      expect(body.movies.length).toBeGreaterThan(0);
    });
  });
});

describe("Get Movie by ID", () => {
  describe("Berhasil mendapatkan 1 movie sesuai dengan params id yang diberikan", () => {
    test("Should return status 200 and movie object", async () => {
      let { status, body } = await request(app).get("/movies/1");

      expect(status).toBe(200);
      expect(body).toHaveProperty("movie");
      expect(body.movie).toHaveProperty("id", 1);
      expect(body.movie).toHaveProperty("title", expect.any(String));
      expect(body.movie).toHaveProperty("overview", expect.any(String));
      expect(body.movie).toHaveProperty("genres", expect.any(Array));
    });
  });

  describe("Gagal mendapatkan movie karena params id yang diberikan tidak ada di database", () => {
    test("Should return status 404 and error message", async () => {
      let { status, body } = await request(app).get("/movies/999");

      expect(status).toBe(404);
      expect(body).toHaveProperty("message", "Movie with id 999 not found");
    });
  });
});

describe("Get Genres", () => {
  describe("Berhasil mendapatkan semua genre yang tersedia", () => {
    test("Should return status 200 and array of genres", async () => {
      let { status, body } = await request(app).get("/movies/meta/genres");

      expect(status).toBe(200);
      expect(body).toHaveProperty("genres", expect.any(Array));
      expect(body.genres.length).toBeGreaterThan(0);
      expect(body.genres).toContain("Action");
    });
  });
});

describe("Get Movie Stats", () => {
  describe("Berhasil mendapatkan statistik movie", () => {
    test("Should return status 200 and movie statistics", async () => {
      let { status, body } = await request(app).get("/movies/meta/stats");

      expect(status).toBe(200);
      expect(body).toHaveProperty("totalMovies", expect.any(Number));
      expect(body).toHaveProperty("averageRating", expect.any(String));
    });
  });
});

afterAll(async () => {
  await queryInterface.bulkDelete("Movies", null, {
    truncate: true,
    cascade: true,
    restartIdentity: true,
  });

  await queryInterface.bulkDelete("Users", null, {
    truncate: true,
    cascade: true,
    restartIdentity: true,
  });
});
