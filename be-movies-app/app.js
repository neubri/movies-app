if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const cors = require("cors");
const express = require("express");

const errorHandler = require("./middlewares/errorHandler");
const authentication = require("./middlewares/authentication");
const authController = require("./controllers/authController");
const moviesController = require("./controllers/MoviesController");
const userMoviesController = require("./controllers/userMoviesController");
const pubController = require("./controllers/pubController");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Public TMDB endpoints (no auth required)
app.get("/pub/movies", pubController.getMovies);
app.get("/pub/movies/popular", pubController.getPopularMovies);
app.get("/pub/movies/:id", pubController.getMovieById);
app.get("/pub/genres", pubController.getGenres);

// Auth endpoints
app.post("/register", authController.register);
app.post("/login", authController.login);
app.post("/google-login", authController.googleLogin);

// Local DB movies endpoints
app.get("/movies", authentication, moviesController.getMovies);
app.get("/movies/:id", authentication, moviesController.getMoviesById);

// User movies endpoints (requires auth)
app.use("/user-movies", authentication);
app.post("/user-movies", userMoviesController.addUserMovie);
app.get("/user-movies", userMoviesController.getUserMovies);
app.patch("/user-movies/:id/status", userMoviesController.updateMovieStatus);
app.delete("/user-movies/:id", userMoviesController.deleteUserMovie);

// Recommendations endpoints (requires auth) - now using MoviesController
app.get(
  "/recommendations",
  authentication,
  moviesController.getRecommendations
);
app.get(
  "/recommendations/history",
  authentication,
  moviesController.getRecommendationHistory
);

app.use(errorHandler);

module.exports = app;
