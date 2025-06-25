if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const cors = require("cors");
const express = require("express");
const multer = require("multer");

const UserController = require("./controllers/UserController");
const MovieController = require("./controllers/MovieController");
const FavoriteController = require("./controllers/FavoriteController");
const RecommendationController = require("./controllers/RecommendationController");
const PubController = require("./controllers/PubController");
const errorHandler = require("./middlewares/errorHandler");
const authentication = require("./middlewares/authentication");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Test endpoint
app.get("/", (req, res) => {
  res.json({
    message: "AI Movie Recommender API",
    version: "1.0.0",
    endpoints: {
      public: [
        "GET /",
        "POST /register",
        "POST /login",
        "POST /google-login",
        "GET /pub/movies",
        "GET /pub/movies/:id",
        "GET /pub/genres"
      ],
      authenticated: [
        "GET /movies",
        "GET /movies/:id",
        "POST /favorites",
        "DELETE /favorites/:movieId",
        "GET /favorites",
        "POST /recommendations",
        "GET /profile"
      ]
    }
  });
});

// ========== AUTH ROUTES ==========
app.post("/register", UserController.register);
app.post("/login", UserController.login);
app.post("/google-login", UserController.googleLogin);

// ========== SETUP ROUTERS ==========
const movieRouter = express.Router();
const favoriteRouter = express.Router();
const recommendationRouter = express.Router();
const pubRouter = express.Router();

// ========== MIDDLEWARE ==========
movieRouter.use(authentication);
favoriteRouter.use(authentication);
recommendationRouter.use(authentication);

// ========== MOVIE ROUTES ==========
movieRouter.get("/", MovieController.getMovies);
movieRouter.get("/:id", MovieController.getMovieById);

// ========== FAVORITE ROUTES ==========
favoriteRouter.get("/", FavoriteController.getFavorites);
favoriteRouter.post("/", FavoriteController.addFavorite);
favoriteRouter.delete("/:movieId", FavoriteController.removeFavorite);

// ========== RECOMMENDATION ROUTES ==========
recommendationRouter.post("/", RecommendationController.getRecommendations);

// ========== PUBLIC ROUTES ==========
pubRouter.get("/movies", PubController.getMovies);
pubRouter.get("/movies/:id", PubController.getMovieById);
pubRouter.get("/genres", PubController.getGenres);

// ========== USER PROFILE ROUTES ==========
app.get("/profile", authentication, UserController.getProfile);
app.put("/profile", authentication, UserController.updateProfile);

// ========== MOUNT ROUTERS ==========
app.use("/movies", movieRouter);
app.use("/favorites", favoriteRouter);
app.use("/recommendations", recommendationRouter);
app.use("/pub", pubRouter);

// ========== ERROR HANDLER ==========
app.use(errorHandler);

module.exports = app;
