const { Movie } = require('../models');
const { Op } = require('sequelize');

module.exports = class PubController {
  static async getMovies(req, res, next) {
    try {
      const { search, genre, sort, page } = req.query;

      const where = {};

      // Search functionality
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { overview: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Filter by genre
      if (genre) {
        where.genre = { [Op.iLike]: `%${genre}%` };
      }

      const options = {
        where,
        attributes: [
          'id', 'title', 'overview', 'posterPath',
          'releaseDate', 'rating', 'genre'
        ]
      };

      // Sorting
      if (sort) {
        const ordering = sort.startsWith('-') ? 'DESC' : 'ASC';
        const columnName = sort.startsWith('-') ? sort.slice(1) : sort;

        const validSortColumns = ['title', 'releaseDate', 'rating'];
        if (validSortColumns.includes(columnName)) {
          options.order = [[columnName, ordering]];
        }
      } else {
        options.order = [['rating', 'DESC']]; // Default sort by highest rated
      }

      // Pagination
      const limit = parseInt(page?.size) || 20;
      const pageNumber = parseInt(page?.number) || 1;
      options.limit = limit;
      options.offset = limit * (pageNumber - 1);

      const { count, rows } = await Movie.findAndCountAll(options);

      res.json({
        message: "Movies retrieved successfully",
        data: {
          movies: rows,
          pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(count / limit),
            totalMovies: count,
            moviesPerPage: limit
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMovieById(req, res, next) {
    try {
      const movieId = parseInt(req.params.id);

      const movie = await Movie.findByPk(movieId, {
        attributes: [
          'id', 'title', 'overview', 'posterPath',
          'releaseDate', 'rating', 'genre'
        ]
      });

      if (!movie) {
        throw { name: "NotFound", message: `Movie with id ${movieId} not found` };
      }

      res.json({
        message: "Movie retrieved successfully",
        data: movie
      });
    } catch (err) {
      next(err);
    }
  }

  static async getGenres(req, res, next) {
    try {
      // Get unique genres from movies
      const genres = await Movie.findAll({
        attributes: ['genre'],
        group: ['genre'],
        order: [['genre', 'ASC']]
      });

      const genreList = genres
        .map(g => g.genre)
        .filter(genre => genre && genre.trim() !== '')
        .flatMap(genre => genre.split(',').map(g => g.trim()))
        .filter((genre, index, arr) => arr.indexOf(genre) === index)
        .sort();

      res.json({
        message: "Genres retrieved successfully",
        data: genreList
      });
    } catch (err) {
      next(err);
    }
  }

  static async getFeaturedMovies(req, res, next) {
    try {
      // Get top-rated movies as featured
      const featuredMovies = await Movie.findAll({
        where: {
          rating: { [Op.gte]: 7.5 } // Movies with rating >= 7.5
        },
        order: [['rating', 'DESC']],
        limit: 10,
        attributes: [
          'id', 'title', 'overview', 'posterPath',
          'releaseDate', 'rating', 'genre'
        ]
      });

      res.json({
        message: "Featured movies retrieved successfully",
        data: featuredMovies
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMoviesByGenre(req, res, next) {
    try {
      const { genre } = req.params;
      const { limit = 10 } = req.query;

      const movies = await Movie.findAll({
        where: {
          genre: { [Op.iLike]: `%${genre}%` }
        },
        order: [['rating', 'DESC']],
        limit: parseInt(limit),
        attributes: [
          'id', 'title', 'overview', 'posterPath',
          'releaseDate', 'rating', 'genre'
        ]
      });

      res.json({
        message: `${genre} movies retrieved successfully`,
        data: {
          genre,
          movies,
          count: movies.length
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
