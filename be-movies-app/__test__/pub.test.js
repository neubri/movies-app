const app = require("../app");
const request = require("supertest");
const { sequelize, User } = require("../models");
const { queryInterface } = sequelize;
const { signToken } = require("../helpers/jwt");
const axios = require("axios");

jest.mock("axios");

let access_token_valid_user;

beforeAll(async () => {
  // Create test user
  const user = await User.create({
    username: "testuser",
    email: "test@mail.com",
    password: "password123",
    preferredGenres: "Action, Comedy"
  });

  access_token_valid_user = signToken({ id: user.id });
});

describe("Public Movie Routes", () => {
  describe("GET /pub/movies", () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test("Should return movies from TMDB API", async () => {
      const mockMoviesResponse = {
        data: {
          results: [
            {
              id: 1,
              title: "Test Movie",
              overview: "Test Overview",
              poster_path: "/test.jpg",
              vote_average: 8.5,
              genre_ids: [28],
              release_date: "2025-01-01"
            }
          ],
          total_pages: 1,
          page: 1,
          total_results: 1
        }
      };

      const mockGenresResponse = {
        data: {
          genres: [
            { id: 28, name: "Action" },
            { id: 35, name: "Comedy" }
          ]
        }
      };

      // Mock both the movie request and genre request
      axios.get
        .mockResolvedValueOnce(mockMoviesResponse) // First call for movies
        .mockResolvedValueOnce(mockGenresResponse); // Second call for genres

      const { status, body } = await request(app).get("/pub/movies");

      expect(status).toBe(200);
      expect(body).toHaveProperty("statusCode", 200);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("query");
      expect(Array.isArray(body.data.query)).toBeTruthy();
      expect(body.data.query[0]).toHaveProperty("id");
      expect(body.data.query[0]).toHaveProperty("title");
      expect(body.data.query[0]).toHaveProperty("synopsis");
      expect(body.data.query[0]).toHaveProperty("imgUrl");
    });

    test("Should handle TMDB API errors", async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 500,
          data: { status_message: "TMDB API Error" }
        }
      });

      const { status, body } = await request(app).get("/pub/movies");

      expect(status).toBe(500);
      expect(body).toHaveProperty("message");
    });

    test("Should handle search queries", async () => {
      const mockMoviesResponse = {
        data: {
          results: [
            {
              id: 1,
              title: "Searched Movie",
              overview: "Test Overview",
              poster_path: "/test.jpg",
              vote_average: 8.5,
              genre_ids: [28],
              release_date: "2025-01-01"
            }
          ],
          total_pages: 1,
          page: 1,
          total_results: 1
        }
      };

      const mockGenresResponse = {
        data: {
          genres: [{ id: 28, name: "Action" }]
        }
      };

      axios.get
        .mockResolvedValueOnce(mockMoviesResponse)
        .mockResolvedValueOnce(mockGenresResponse);

      const { status, body } = await request(app)
        .get("/pub/movies?search=test");

      expect(status).toBe(200);
      expect(body.data.query).toHaveLength(1);
    });

    test("Should handle filter by genre", async () => {
      const mockMoviesResponse = {
        data: {
          results: [
            {
              id: 1,
              title: "Action Movie",
              overview: "Action Overview",
              poster_path: "/action.jpg",
              vote_average: 8.5,
              genre_ids: [28],
              release_date: "2025-01-01"
            }
          ],
          total_pages: 1,
          page: 1,
          total_results: 1
        }
      };

      const mockGenresResponse = {
        data: {
          genres: [{ id: 28, name: "Action" }]
        }
      };

      axios.get
        .mockResolvedValueOnce(mockMoviesResponse)
        .mockResolvedValueOnce(mockGenresResponse);

      const { status, body } = await request(app)
        .get("/pub/movies?filter=28");

      expect(status).toBe(200);
      expect(body.data.query).toHaveLength(1);
    });

    test("Should handle sorting", async () => {
      const mockMoviesResponse = {
        data: {
          results: [
            {
              id: 1,
              title: "Test Movie",
              overview: "Test Overview",
              poster_path: "/test.jpg",
              vote_average: 8.5,
              genre_ids: [28],
              release_date: "2025-01-01"
            }
          ],
          total_pages: 1,
          page: 1,
          total_results: 1
        }
      };

      const mockGenresResponse = {
        data: {
          genres: [{ id: 28, name: "Action" }]
        }
      };

      axios.get
        .mockResolvedValueOnce(mockMoviesResponse)
        .mockResolvedValueOnce(mockGenresResponse);

      const { status, body } = await request(app)
        .get("/pub/movies?sort=title");

      expect(status).toBe(200);
      expect(body.data.query).toHaveLength(1);
    });

    test("Should handle descending sort", async () => {
      const mockMoviesResponse = {
        data: {
          results: [
            {
              id: 1,
              title: "Test Movie",
              overview: "Test Overview",
              poster_path: "/test.jpg",
              vote_average: 8.5,
              genre_ids: [28],
              release_date: "2025-01-01"
            }
          ],
          total_pages: 1,
          page: 1,
          total_results: 1
        }
      };

      const mockGenresResponse = {
        data: {
          genres: [{ id: 28, name: "Action" }]
        }
      };

      axios.get
        .mockResolvedValueOnce(mockMoviesResponse)
        .mockResolvedValueOnce(mockGenresResponse);

      const { status, body } = await request(app)
        .get("/pub/movies?sort=-rating");

      expect(status).toBe(200);
      expect(body.data.query).toHaveLength(1);
    });

    test("Should handle pagination", async () => {
      const mockMoviesResponse = {
        data: {
          results: [
            {
              id: 1,
              title: "Test Movie",
              overview: "Test Overview",
              poster_path: "/test.jpg",
              vote_average: 8.5,
              genre_ids: [28],
              release_date: "2025-01-01"
            }
          ],
          total_pages: 5,
          page: 2, // This should match what we request
          total_results: 100
        }
      };

      const mockGenresResponse = {
        data: {
          genres: [{ id: 28, name: "Action" }]
        }
      };

      axios.get
        .mockResolvedValueOnce(mockMoviesResponse)
        .mockResolvedValueOnce(mockGenresResponse);

      const { status, body } = await request(app)
        .get("/pub/movies?page[number]=2&page[size]=5");

      expect(status).toBe(200);
      expect(body.data.pagination.currentPage).toBe(2);
    });

    test("Should handle invalid pagination parameters gracefully", async () => {
      const mockMoviesResponse = {
        data: {
          results: [],
          total_pages: 1,
          page: 1,
          total_results: 0
        }
      };

      const mockGenresResponse = {
        data: {
          genres: []
        }
      };

      axios.get
        .mockResolvedValueOnce(mockMoviesResponse)
        .mockResolvedValueOnce(mockGenresResponse);

      const { status, body } = await request(app)
        .get("/pub/movies?page[number]=invalid&page[size]=invalid");

      expect(status).toBe(200);
      expect(body.data.pagination.currentPage).toBe(1); // Should default to 1
    });

    test("Should handle 401 unauthorized error", async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { status_message: "Invalid API key" }
        }
      });

      const { status, body } = await request(app).get("/pub/movies");

      expect(status).toBe(401);
      expect(body.message).toBe("Invalid TMDB API token");
    });

    test("Should handle 404 not found error", async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 404,
          data: { status_message: "Not found" }
        }
      });

      const { status, body } = await request(app).get("/pub/movies");

      expect(status).toBe(404);
      expect(body.message).toBe("No movies found");
    });

    test("Should handle network errors without response", async () => {
      axios.get.mockRejectedValue(new Error("Network error"));

      const { status, body } = await request(app).get("/pub/movies");

      expect(status).toBe(500);
      expect(body.message).toBe("Error fetching movies from TMDB");
    });
  });

  describe("GET /pub/movies/popular", () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test("Should return popular movies from TMDB API", async () => {
      const mockMoviesResponse = {
        data: {
          results: [
            {
              id: 1,
              title: "Popular Movie",
              overview: "Popular Overview",
              poster_path: "/popular.jpg",
              vote_average: 9.0,
              genre_ids: [28],
              release_date: "2025-01-01"
            }
          ],
          total_pages: 1,
          page: 1,
          total_results: 1
        }
      };

      const mockGenresResponse = {
        data: {
          genres: [{ id: 28, name: "Action" }]
        }
      };

      axios.get
        .mockResolvedValueOnce(mockMoviesResponse)
        .mockResolvedValueOnce(mockGenresResponse);

      const { status, body } = await request(app).get("/pub/movies/popular");

      expect(status).toBe(200);
      expect(body.data.query).toHaveLength(1);
      expect(body.data.query[0].title).toBe("Popular Movie");
    });

    test("Should handle pagination for popular movies", async () => {
      const mockMoviesResponse = {
        data: {
          results: [
            {
              id: 1,
              title: "Popular Movie",
              overview: "Popular Overview",
              poster_path: "/popular.jpg",
              vote_average: 9.0,
              genre_ids: [28],
              release_date: "2025-01-01"
            }
          ],
          total_pages: 5,
          page: 2,
          total_results: 100
        }
      };

      const mockGenresResponse = {
        data: {
          genres: [{ id: 28, name: "Action" }]
        }
      };

      axios.get
        .mockResolvedValueOnce(mockMoviesResponse)
        .mockResolvedValueOnce(mockGenresResponse);

      const { status, body } = await request(app)
        .get("/pub/movies/popular?page[number]=2&page[size]=10");

      expect(status).toBe(200);
      expect(body.data.pagination.currentPage).toBe(2);
    });

    test("Should handle 401 error for popular movies", async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { status_message: "Invalid API key" }
        }
      });

      const { status, body } = await request(app).get("/pub/movies/popular");

      expect(status).toBe(401);
      expect(body.message).toBe("Invalid TMDB API token");
    });

    test("Should handle general errors for popular movies", async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 500,
          data: { status_message: "Server error" }
        }
      });

      const { status, body } = await request(app).get("/pub/movies/popular");

      expect(status).toBe(500);
      expect(body.message).toBe("Server error");
    });

    test("Should handle network errors for popular movies", async () => {
      axios.get.mockRejectedValue(new Error("Network error"));

      const { status, body } = await request(app).get("/pub/movies/popular");

      expect(status).toBe(500);
      expect(body.message).toBe("Error fetching popular movies from TMDB");
    });
  });

  describe("GET /pub/movies/:id", () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test("Should return specific movie from TMDB API", async () => {
      const mockMovie = {
        data: {
          id: 1,
          title: "Test Movie",
          overview: "Test Overview",
          poster_path: "/test.jpg",
          vote_average: 8.5,
          genres: [{ id: 28, name: "Action" }],
          release_date: "2025-01-01",
          videos: {
            results: [{ key: "test_video_key" }]
          }
        }
      };

      axios.get.mockResolvedValue(mockMovie);

      const { status, body } = await request(app).get("/pub/movies/1");

      expect(status).toBe(200);
      expect(body).toHaveProperty("statusCode", 200);
      expect(body.data).toHaveProperty("movie");
      expect(body.data.movie).toHaveProperty("id", 1);
      expect(body.data.movie).toHaveProperty("title", "Test Movie");
      expect(body.data.movie).toHaveProperty("trailerUrl");
    });

    test("Should handle movie without trailer", async () => {
      const mockMovie = {
        data: {
          id: 1,
          title: "Test Movie",
          overview: "Test Overview",
          poster_path: "/test.jpg",
          vote_average: 8.5,
          genres: [{ id: 28, name: "Action" }],
          release_date: "2025-01-01",
          videos: {
            results: []
          }
        }
      };

      axios.get.mockResolvedValue(mockMovie);

      const { status, body } = await request(app).get("/pub/movies/1");

      expect(status).toBe(200);
      expect(body.data.movie.trailerUrl).toBeNull();
    });

    test("Should handle 404 from TMDB API", async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 404,
          data: { status_message: "Movie not found" }
        }
      });

      const { status, body } = await request(app).get("/pub/movies/999999");

      expect(status).toBe(404);
      expect(body).toHaveProperty("message", "Movie with ID 999999 not found");
    });

    test("Should handle 401 error for single movie", async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { status_message: "Invalid API key" }
        }
      });

      const { status, body } = await request(app).get("/pub/movies/1");

      expect(status).toBe(401);
      expect(body.message).toBe("Invalid TMDB API token");
    });

    test("Should handle general errors for single movie", async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 500,
          data: { status_message: "Server error" }
        }
      });

      const { status, body } = await request(app).get("/pub/movies/1");

      expect(status).toBe(500);
      expect(body.message).toBe("Server error");
    });

    test("Should handle network errors for single movie", async () => {
      axios.get.mockRejectedValue(new Error("Network error"));

      const { status, body } = await request(app).get("/pub/movies/1");

      expect(status).toBe(500);
      expect(body.message).toBe("Error fetching movie details from TMDB");
    });
  });

  describe("GET /pub/genres", () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test("Should return genres from TMDB API", async () => {
      const mockGenres = {
        data: {
          genres: [
            { id: 28, name: "Action" },
            { id: 35, name: "Comedy" }
          ]
        }
      };

      axios.get.mockResolvedValue(mockGenres);

      const { status, body } = await request(app).get("/pub/genres");

      expect(status).toBe(200);
      expect(body).toHaveProperty("statusCode", 200);
      expect(body).toHaveProperty("data");
      expect(body.data).toHaveProperty("query");
      expect(Array.isArray(body.data.query)).toBeTruthy();
      expect(body.data.query[0]).toHaveProperty("id");
      expect(body.data.query[0]).toHaveProperty("name");
      expect(body.data.query[0]).toHaveProperty("createdAt");
      expect(body.data.query[0]).toHaveProperty("updatedAt");
    });

    test("Should handle 401 error for genres", async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { status_message: "Invalid API key" }
        }
      });

      const { status, body } = await request(app).get("/pub/genres");

      expect(status).toBe(401);
      expect(body.message).toBe("Invalid TMDB API token");
    });

    test("Should handle TMDB API errors for genres", async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 500,
          data: { status_message: "TMDB API Error" }
        }
      });

      const { status, body } = await request(app).get("/pub/genres");

      expect(status).toBe(500);
      expect(body).toHaveProperty("message");
    });

    test("Should handle network errors for genres", async () => {
      axios.get.mockRejectedValue(new Error("Network error"));

      const { status, body } = await request(app).get("/pub/genres");

      expect(status).toBe(500);
      expect(body.message).toBe("Error fetching genres from TMDB");
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
