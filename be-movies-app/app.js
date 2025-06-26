if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const cors = require("cors");
const express = require("express");

const UserController = require("./controllers/UserController");
const MoviesController = require("./controllers/MoviesController");
const FavoriteController = require("./controllers/FavoritesController");
const errorHandler = require("./middlewares/errorHandler");
const authentication = require("./middlewares/authentication");
const PubController = require("./controllers/PubController");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========== AUTH ROUTES ==========
//users endpoints
//ini bukan dari router jadi authentikasi nya masukin manual
app.post("/login", UserController.login);
app.post("/register", authentication, UserController.register);

// ========== SETUP ==========
const moviesRouter = express.Router();
const favoriteRouter = express.Router();
const pubRouter = express.Router();

// ========== MIDDLEWARE ==========
//pasang middleware di router article
moviesRouter.use(authentication);
// categoryRouter.use(authentication);

// ========== MOVIE ROUTES ==========
moviesRouter.get("/", MoviesController.getMovies);
moviesRouter.post("/", MoviesController.createMovies);
moviesRouter.get("/:id", MoviesController.getMoviesById);


// ========== CATEGORY ROUTES ==========
categoryRouter.get("/", categoryController.getCategory);

// ========== FAVORITE ROUTES ==========
favoriteRouter.get("/", FavoriteController.getFavorites);
favoriteRouter.post("/", FavoriteController.createFavorite);
favoriteRouter.put("/:id", FavoriteController.updateFavoriteById);
favoriteRouter.delete("/:id", FavoriteController.deleteFavoriteById);

// ========== PUBLIC ROUTES ==========
pubRouter.get("/movies", PubController.getMovies);
pubRouter.get("/categories", PubController.getCategory);
pubRouter.get("/movies/:id", PubController.getMoviesById);

app.use("/movies", moviesRouter);
app.use("/favorites", favoriteRouter);
app.use("/pub", pubRouter);

//disini pasang errorHandler nya paling bawah sebelum port
app.use(errorHandler);

module.exports = app;
