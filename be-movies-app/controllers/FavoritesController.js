const { Favorite, Movie, User } = require('../models');

module.exports = class FavoriteController {
  static async getFavorites(req, res, next) {
    try {
      const userId = req.user.id;

      const favorites = await Favorite.findAll({
        where: { userId },
        include: [
          {
            model: Movie,
            attributes: [
              'id', 'title', 'overview', 'posterPath',
              'releaseDate', 'rating', 'genre'
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const favoriteMovies = favorites.map(favorite => {
        const movie = favorite.Movie.toJSON();
        movie.favoriteId = favorite.id;
        movie.addedAt = favorite.createdAt;
        movie.isFavorite = true;
        return movie;
      });

      res.json({
        message: "Favorite movies retrieved successfully",
        data: {
          favorites: favoriteMovies,
          count: favoriteMovies.length
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async addFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { movieId } = req.body;

      if (!movieId) {
        throw { name: "BadRequest", message: "Movie ID is required" };
      }

      // Check if movie exists
      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        throw { name: "NotFound", message: "Movie not found" };
      }

      // Check if already in favorites
      const existingFavorite = await Favorite.findOne({
        where: { userId, movieId }
      });

      if (existingFavorite) {
        throw { name: "BadRequest", message: "Movie is already in favorites" };
      }

      const favorite = await Favorite.create({
        userId,
        movieId
      });

      // Get the movie details for response
      const movieWithFavorite = await Movie.findByPk(movieId);
      const movieData = movieWithFavorite.toJSON();
      movieData.favoriteId = favorite.id;
      movieData.isFavorite = true;
      movieData.addedAt = favorite.createdAt;

      res.status(201).json({
        message: "Movie added to favorites successfully",
        data: movieData
      });
    } catch (err) {
      next(err);
    }
  }

  static async removeFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const movieId = parseInt(req.params.movieId);

      if (!movieId) {
        throw { name: "BadRequest", message: "Movie ID is required" };
      }

      const favorite = await Favorite.findOne({
        where: { userId, movieId }
      });

      if (!favorite) {
        throw { name: "NotFound", message: "Movie not found in favorites" };
      }

      await favorite.destroy();

      res.json({
        message: "Movie removed from favorites successfully",
        data: {
          movieId,
          removedAt: new Date()
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async toggleFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { movieId } = req.body;

      if (!movieId) {
        throw { name: "BadRequest", message: "Movie ID is required" };
      }

      // Check if movie exists
      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        throw { name: "NotFound", message: "Movie not found" };
      }

      // Check if already in favorites
      const existingFavorite = await Favorite.findOne({
        where: { userId, movieId }
      });

      if (existingFavorite) {
        // Remove from favorites
        await existingFavorite.destroy();

        const movieData = movie.toJSON();
        movieData.isFavorite = false;

        res.json({
          message: "Movie removed from favorites",
          data: movieData
        });
      } else {
        // Add to favorites
        const favorite = await Favorite.create({
          userId,
          movieId
        });

        const movieData = movie.toJSON();
        movieData.favoriteId = favorite.id;
        movieData.isFavorite = true;
        movieData.addedAt = favorite.createdAt;

        res.status(201).json({
          message: "Movie added to favorites",
          data: movieData
        });
      }
    } catch (err) {
      next(err);
    }
  }
};
