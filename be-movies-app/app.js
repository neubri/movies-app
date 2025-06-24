if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const cors = require("cors");
const express = require("express");
const multer = require("multer"); //multer step 1 - setelah npm i multer dan axios

const UserController = require("./controllers/UsersController");
const TestController = require("./controllers/TestController");
const ArticleController = require("./controllers/ArticleController");
const CategoryController = require("./controllers/CategoryController");
const PubController = require("./controllers/PubController");
const errorHandler = require("./middlewares/errorHandler");
const authentication = require("./middlewares/authentication");
const { isAdmin, isAdminOrStaff } = require("./middlewares/authorization");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", TestController.getTest);

// ========== AUTH ROUTES ==========
//users endpoints
//ini bukan dari router jadi authentikasi nya masukin manual
app.post("/login", UserController.login);
app.post("/add-user", authentication, isAdmin, UserController.addUser);

// ========== SETUP ==========
const articleRouter = express.Router();
const categoryRouter = express.Router();
const pubRouter = express.Router();

// ========== MIDDLEWARE ==========
//pasang middleware di router article
articleRouter.use(authentication);
// categoryRouter.use(authentication);

// ========== ARTICLE ROUTES ==========
articleRouter.get("/", ArticleController.getArticle);
articleRouter.post("/", ArticleController.createArticle);
articleRouter.get("/:id", ArticleController.getArticleById);
articleRouter.put("/:id", isAdminOrStaff, ArticleController.updateArticleById);
articleRouter.delete(
  "/:id",
  isAdminOrStaff,
  ArticleController.deleteArticleById
);

//multer
//link: https://www.npmjs.com/package/multer (yang single)
articleRouter.patch(
  "/:id/img-url",
  isAdminOrStaff,
  upload.single("imageURL"),
  ArticleController.updateArticleImageUrlById
);

// ========== CATEGORY ROUTES ==========
categoryRouter.get("/", CategoryController.getCategory);
categoryRouter.post("/", CategoryController.createCategory);
categoryRouter.put("/:id", CategoryController.updateCategoryById);

// ========== PUBLIC ROUTES ==========
pubRouter.get("/movies", PubController.getArticle);
pubRouter.get("/genres", PubController.getCategory);
pubRouter.get("/movies/:id", PubController.getArticleById);

app.use("/movies", articleRouter);
app.use("/genres", categoryRouter);
app.use("/pub", pubRouter);

//disini pasang errorHandler nya paling bawah sebelum port
app.use(errorHandler);

module.exports = app;
