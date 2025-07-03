const { UserMovies, Movie, User } = require("../models");

class UserMoviesController {
  static async  addUserMovie(req, res, next) {
    try {
      const userId = req.user.id;
      const { movieId, type } = req.body;

      if (!movieId || !type) {
        throw { name: "BadRequest", message: "Movie ID and type are required" };
      }

      if (!['favorite', 'watchlist'].includes(type)) {
        throw { name: "BadRequest", message: "Type must be 'favorite' or 'watchlist'" };
      }

      // Check if movie exists
      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        throw { name: "NotFound", message: `Movie with id ${movieId} not found` };
      }

      // Check if already in user's list
      const existing = await UserMovies.findOne({
        where: { userId, movieId, type }
      });

      if (existing) {
        throw { name: "BadRequest", message: `Movie already in your ${type}` };
      }

      const userMovie = await UserMovies.create({
        userId,
        movieId,
        type,
        status: type === 'watchlist' ? 'pending' : null
      });

      res.status(201).json({
        statusCode: 201,
        data: {
          userMovie
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUserMovies(req, res, next) {
    try {
      const userId = req.user.id;
      const { type, status } = req.query;

      const where = { userId };

      if (type) {
        if (!['favorite', 'watchlist'].includes(type)) {
          throw { name: "BadRequest", message: "Type must be 'favorite' or 'watchlist'" };
        }
        where.type = type;
      }

      if (status) {
        if (!['pending', 'watched'].includes(status)) {
          throw { name: "BadRequest", message: "Status must be 'pending' or 'watched'" };
        }
        where.status = status;
      }

      const userMovies = await UserMovies.findAll({
        where,
        include: [{
          model: Movie,
          attributes: ['id', 'title', 'posterPath', 'overview', 'releaseDate', 'genreIds']
        }],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        statusCode: 200,
        data: {
          userMovies
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateMovieStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['watched'].includes(status)) {
        throw { name: "BadRequest", message: "Status must be 'watched'" };
      }

      const userMovie = await UserMovies.findOne({
        where: { id, userId, type: 'watchlist' }
      });

      if (!userMovie) {
        throw { name: "NotFound", message: "Movie not found in your watchlist" };
      }

      await userMovie.update({ status });

      res.status(200).json({
        statusCode: 200,
        data: {
          userMovie
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteUserMovie(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const userMovie = await UserMovies.findOne({
        where: { id, userId }
      });

      if (!userMovie) {
        throw { name: "NotFound", message: "Movie not found in your list" };
      }

      await userMovie.destroy();

      res.status(200).json({
        statusCode: 200,
        message: "Movie removed from your list"
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserMoviesController;
