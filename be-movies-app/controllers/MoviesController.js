const { Movie, sequelize } = require('../models');
const { Op } = require('sequelize');

module.exports = class MovieController {
  static async getMovies(req, res, next) {
    try {
      const {
        search,
        filter,
        sort,
        minRating,
        maxRating,
        year
      } = req.query;

      const where = {};

      // Filter by genre
      if (filter) {
        where.genres = {
          [Op.contains]: [filter]
        };
      }

      // Search by title
      if (search) {
        where.title = {
          [Op.iLike]: `%${search}%`
        };
      }

      // Filter by rating range
      if (minRating || maxRating) {
        where.voteAverage = {};
        if (minRating) where.voteAverage[Op.gte] = parseFloat(minRating);
        if (maxRating) where.voteAverage[Op.lte] = parseFloat(maxRating);
      }

      // Filter by year
      if (year) {
        where.releaseDate = {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`]
        };
      }

      const paramsQuerySQL = { where };

      // Sorting
      if (sort) {
        const ordering = sort[0] === "-" ? "DESC" : "ASC";
        const columnName = ordering === "DESC" ? sort.slice(1) : sort;
        paramsQuerySQL.order = [[columnName, ordering]];
      } else {
        paramsQuerySQL.order = [['releaseDate', 'DESC']];
      }

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

      paramsQuerySQL.limit = limit;
      paramsQuerySQL.offset = limit * (pageNumber - 1);
      paramsQuerySQL.attributes = { exclude: ['createdAt', 'updatedAt'] };

      const { count, rows } = await Movie.findAndCountAll(paramsQuerySQL);

      res.json({
        page: pageNumber,
        movies: rows,
        totalData: count,
        totalPage: Math.ceil(count / limit),
        dataPerPage: limit,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: pageNumber < Math.ceil(count / limit),
          hasPreviousPage: pageNumber > 1
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMovieById(req, res, next) {
    try {
      const movieId = +req.params.id;

      const movie = await Movie.findByPk(movieId, {
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      });

      if (!movie) {
        throw { name: "NotFound", message: `Movie with id ${movieId} not found` };
      }

      res.json({ movie });
    } catch (err) {
      next(err);
    }
  }

  static async getGenres(req, res, next) {
    try {
      const movies = await Movie.findAll({
        attributes: ['genres']
      });

      const genreSet = new Set();
      movies.forEach(movie => {
        movie.genres.forEach(genre => {
          genreSet.add(genre);
        });
      });

      const genres = Array.from(genreSet).sort();
      res.json({ genres });
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req, res, next) {
    try {
      const totalMovies = await Movie.count();

      const avgRating = await Movie.findAll({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('voteAverage')), 'avgRating'],
          [sequelize.fn('MIN', sequelize.col('releaseDate')), 'oldestMovie'],
          [sequelize.fn('MAX', sequelize.col('releaseDate')), 'newestMovie']
        ]
      });

      res.json({
        totalMovies,
        averageRating: parseFloat(avgRating[0].dataValues.avgRating).toFixed(2),
        oldestMovieDate: avgRating[0].dataValues.oldestMovie,
        newestMovieDate: avgRating[0].dataValues.newestMovie
      });
    } catch (err) {
      next(err);
    }
  }
};
