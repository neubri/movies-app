const { Favorite, Movie, User } = require('../models');

module.exports = class FavoriteController {
  static async getFavorites(req, res, next) {
    try {
      const userId = req.user.id;
      const { sort } = req.query;

      // Default limit and page number
      let limit = 20;
      let pageNumber = 1;

      // Pagination
      if (req.query['page[size]']) {
        limit = +req.query['page[size]'];
      }
      if (req.query['page[number]']) {
        pageNumber = +req.query['page[number]'];
      }
 
      const offset = limit * (pageNumber - 1);

      const user = await User.findByPk(userId, {
        include: [{
          model: Movie,
          as: 'favoriteMovies',
          through: {
            attributes: ['createdAt']
          },
          attributes: { exclude: ['createdAt', 'updatedAt'] }
        }]
      });

      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      // Sort movies
      let movies = user.favoriteMovies;

      if (sort) {
        const ordering = sort[0] === "-" ? "DESC" : "ASC";
        const columnName = ordering === "DESC" ? sort.slice(1) : sort;

        if (columnName === 'dateAdded') {
          movies.sort((a, b) => {
            const dateA = new Date(a.Favorite.createdAt);
            const dateB = new Date(b.Favorite.createdAt);
            return ordering === 'DESC' ? dateB - dateA : dateA - dateB;
          });
        } else if (columnName === 'title') {
          movies.sort((a, b) => {
            const comparison = a.title.localeCompare(b.title);
            return ordering === 'DESC' ? -comparison : comparison;
          });
        }
      }

      // Paginate
      const totalItems = movies.length;
      const paginatedMovies = movies.slice(offset, offset + limit);
      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        page: pageNumber,
        favorites: paginatedMovies,
        totalData: totalItems,
        totalPage: totalPages,
        dataPerPage: limit,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async addToFavorites(req, res, next) {
    try {
      const movieId = +req.params.movieId;
      const userId = req.user.id;

      // Check if movie exists
      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        throw { name: "NotFound", message: "Movie not found" };
      }

      // Check if already favorited
      const existingFavorite = await Favorite.findOne({
        where: { userId, movieId }
      });

      if (existingFavorite) {
        throw { name: "BadRequest", message: "Movie already in favorites" };
      }

      // Add to favorites
      await Favorite.create({ userId, movieId });

      res.status(201).json({
        message: 'Movie added to favorites',
        movieId,
        movieTitle: movie.title
      });
    } catch (err) {
      next(err);
    }
  }

  static async removeFromFavorites(req, res, next) {
    try {
      const movieId = +req.params.movieId;
      const userId = req.user.id;

      const favorite = await Favorite.findOne({
        where: { userId, movieId }
      });

      if (!favorite) {
        throw { name: "NotFound", message: "Movie not in favorites" };
      }

      await favorite.destroy();

      res.json({
        message: 'Movie removed from favorites',
        movieId
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkFavoriteStatus(req, res, next) {
    try {
      const movieId = +req.params.movieId;
      const userId = req.user.id;

      const favorite = await Favorite.findOne({
        where: { userId, movieId }
      });

      res.json({
        isFavorited: !!favorite,
        movieId
      });
    } catch (err) {
      next(err);
    }
  }

  static async getFavoritesCount(req, res, next) {
    try {
      const count = await Favorite.count({
        where: { userId: req.user.id }
      });

      res.json({ count });
    } catch (err) {
      next(err);
    }
  }
};
