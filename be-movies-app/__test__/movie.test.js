const app = require("../app");
const request = require("supertest");
const { sequelize, User, Movie } = require("../models");
const { queryInterface } = sequelize;
const { signToken } = require("../helpers/jwt");

let access_token_valid_user;
let token;
let userId;

beforeAll(async () => {
  // Create test user
  const user = await User.create({
    username: "testuser",
    email: "test@mail.com",
    password: "password123",
    preferredGenres: "Action, Comedy",
  });
  userId = user.id;
  access_token_valid_user = signToken({ id: user.id });
  token = access_token_valid_user;

  // Seed some test movies
  await Movie.bulkCreate([
    {
      title: "Test Movie 1",
      posterPath: "/test1.jpg",
      overview: "Test overview 1",
      releaseDate: "2025-07-01",
      genreIds: "1,2",
    },
    {
      title: "Test Movie 2",
      posterPath: "/test2.jpg",
      overview: "Test overview 2",
      releaseDate: "2025-07-02",
      genreIds: "2,3",
    },
  ]);
});

describe("Movie Routes", () => {
  describe("GET /movies", () => {
    test("Should return all movies with pagination", async () => {
      const { status, body } = await request(app)
        .get("/movies")
        .set("Authorization", `Bearer ${access_token_valid_user}`);

      expect(status).toBe(200);
      expect(body).toHaveProperty("data");
      expect(Array.isArray(body.data)).toBeTruthy();
      expect(body).toHaveProperty("totalData");
      expect(body).toHaveProperty("page");
      expect(body).toHaveProperty("totalPage");
      expect(body).toHaveProperty("dataPerPage");
    });

    test("Should filter movies by search term", async () => {
      const { status, body } = await request(app)
        .get("/movies?search=Test")
        .set("Authorization", `Bearer ${access_token_valid_user}`);

      expect(status).toBe(200);
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test("Should filter movies by genre", async () => {
      const { status, body } = await request(app)
        .get("/movies?filter=1")
        .set("Authorization", `Bearer ${access_token_valid_user}`);

      expect(status).toBe(200);
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test("Should sort movies by title ascending", async () => {
      const { status, body } = await request(app)
        .get("/movies?sort=title")
        .set("Authorization", `Bearer ${access_token_valid_user}`);

      expect(status).toBe(200);
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test("Should sort movies by title descending", async () => {
      const { status, body } = await request(app)
        .get("/movies?sort=-title")
        .set("Authorization", `Bearer ${access_token_valid_user}`);

      expect(status).toBe(200);
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test("Should paginate results", async () => {
      const { status, body } = await request(app)
        .get("/movies?page[size]=5&page[number]=1")
        .set("Authorization", `Bearer ${access_token_valid_user}`);

      expect(status).toBe(200);
      expect(body.data.length).toBeLessThanOrEqual(5);
      expect(body.page).toBe(1);
      expect(body.dataPerPage).toBe(5);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/movies");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });

    it("should reject invalid tokens", async () => {
      const res = await request(app)
        .get("/movies")
        .set("Authorization", "Bearer invalid.token.here");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message");
    });
  });

  describe("GET /movies/:id", () => {
    let movieId;

    beforeAll(async () => {
      const movie = await Movie.findOne();
      movieId = movie.id;
    });

    test("Should return a specific movie by ID", async () => {
      const movie = await Movie.findOne();
      const { status, body } = await request(app)
        .get(`/movies/${movie.id}`)
        .set("Authorization", `Bearer ${access_token_valid_user}`);

      expect(status).toBe(200);
      expect(body.data.movie).toHaveProperty("id", movie.id);
      expect(body.data.movie).toHaveProperty("title", movie.title);
    });

    test("Should return 404 for non-existent movie ID", async () => {
      const { status, body } = await request(app)
        .get("/movies/999999")
        .set("Authorization", `Bearer ${access_token_valid_user}`);

      expect(status).toBe(404);
      expect(body).toHaveProperty("message", "Movie with id 999999 not found");
    });

    it("should get a single movie by id", async () => {
      const res = await request(app)
        .get(`/movies/${movieId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.movie).toHaveProperty("id", movieId);
    });

    it("should handle non-existent movie id", async () => {
      const res = await request(app)
        .get("/movies/99999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Movie with id 99999 not found");
    });
  });

  describe("GET /recommendations", () => {
    beforeAll(async () => {
      // Update user with preferred genres
      await User.update(
        { preferredGenres: "Action, Comedy" },
        { where: { id: userId } }
      );
    });

    test("Should return personalized recommendations", async () => {
      const { status, body } = await request(app)
        .get("/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(status).toBe(200);
      expect(body).toHaveProperty("statusCode", 200);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("recommendations");
      expect(body.data).toHaveProperty("totalRecommendations");
      expect(body.data).toHaveProperty("basedOnGenres");
      expect(body.data).toHaveProperty("generatedAt");
      expect(body.data).toHaveProperty("method", "gemini");
    });

    test("Should require authentication", async () => {
      const { status, body } = await request(app)
        .get("/recommendations");

      expect(status).toBe(401);
      expect(body).toHaveProperty("message");
    });

    test("Should handle case when user has no preferred genres", async () => {
      // Temporarily remove preferred genres
      await User.update(
        { preferredGenres: "" },
        { where: { id: userId } }
      );

      const { status, body } = await request(app)
        .get("/recommendations")
        .set("Authorization", `Bearer ${token}`);

      expect(status).toBe(200);
      expect(body).toHaveProperty("message", "Please set your preferred genres to get personalized recommendations");
      expect(body.data.recommendations).toHaveLength(0);

      // Restore preferred genres for other tests
      await User.update(
        { preferredGenres: "Action, Comedy" },
        { where: { id: userId } }
      );
    });
  });

  describe("GET /recommendations/history", () => {
    test("Should return recommendation history", async () => {
      const { status, body } = await request(app)
        .get("/recommendations/history")
        .set("Authorization", `Bearer ${token}`);

      expect(status).toBe(200);
      expect(body).toHaveProperty("statusCode", 200);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("recommendations");
      expect(body.data).toHaveProperty("pagination");
      expect(body.data.pagination).toHaveProperty("totalItems");
      expect(body.data.pagination).toHaveProperty("totalPages");
      expect(body.data.pagination).toHaveProperty("currentPage");
      expect(body.data.pagination).toHaveProperty("itemsPerPage");
    });

    test("Should require authentication", async () => {
      const { status, body } = await request(app)
        .get("/recommendations/history");

      expect(status).toBe(401);
      expect(body).toHaveProperty("message");
    });

    test("Should support pagination", async () => {
      const { status, body } = await request(app)
        .get("/recommendations/history?page=1&limit=5")
        .set("Authorization", `Bearer ${token}`);

      expect(status).toBe(200);
      expect(body.data.pagination.itemsPerPage).toBe(5);
      expect(body.data.pagination.currentPage).toBe(1);
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
