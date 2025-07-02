const { Op } = require("sequelize");
const { Movie } = require("../models");

class moviesController {
  static async getMovies(req, res, next) {
    try {
      console.log(req.query);
      const { search, filter, sort } = req.query;

      const where = {}; // Inisialisasi object kosong

      // Filtering
      if (filter) {
        where.genreIds = filter;
      }

      // Searching
      if (search) {
        where.title = {
          [Op.iLike]: `%${search}%`
        };
      }

      const paramsQuerySQL = { where };

      // Sorting
      if (sort) {
        const ordering = sort[0] === "-" ? "DESC" : "ASC";
        const columnName = ordering === "DESC" ? sort.slice(1) : sort;
        paramsQuerySQL.order = [[columnName, ordering]];
      }

      // Default limit and page number
      let limit = 10; // Default limit
      let pageNumber = 1;

      // Pagination
      if (req.query['page[size]']) {
        limit = +req.query['page[size]'];
      }
      paramsQuerySQL.limit = limit; // Apply the limit to the query

      if (req.query['page[number]']) {
        pageNumber = +req.query['page[number]'];
      }
      paramsQuerySQL.offset = limit * (pageNumber - 1); // Apply the offset to the query

      const { count, rows } = await Movie.findAndCountAll(paramsQuerySQL);

      res.json({
        page: pageNumber,
        data: rows,
        totalData: count,
        totalPage: Math.ceil(count / limit),
        dataPerPage: limit
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMoviesById(req, res, next) {
    try {
      
    } catch (error) {
      next(error)
    }
  }
  // static async getMoviesById(req, res, next) {
  //   try {

  //   } catch (error) {

  //   }
  // }
}

module.exports = moviesController;
