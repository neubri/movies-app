if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const cors = require("cors");
const express = require("express");

const errorHandler = require("./middlewares/errorHandler");
const authentication = require("./middlewares/authentication");
const authController = require("./controllers/authController");
const moviesController = require("./controllers/MoviesController");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//auth
app.post("/register", authController.register);
app.post("/login", authController.login);

//movies
app.get("/movies", moviesController.getMovies);
// app.get("/movies/:id", moviesController.getMoviesById);

// //userMovies
// app.get("/user-movies", authentication, moviesController.getUserMovies);
// app.post("/user-movies", authentication, moviesController.addUserMovie);
// app.delete("/user-movies/:id", authentication, moviesController.deleteUserMovie);
// app.patch("/user-movies/:id", authentication, moviesController.updateUserMovie);

// //recomendations
// app.get("/recommendations", authentication, moviesController.getRecommendations);
// app.get("/recommendations/cache", authentication, moviesController.getRecommendedGenres);

app.use(errorHandler);

module.exports = app;
