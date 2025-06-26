const { Article, Category } = require("../models");
const { Op } = require('sequelize')

module.exports = class PubController {

  static async getArticle(req, res, next) {
    try {
      console.log(req.query);
      const { search, filter, sort } = req.query;

      const where = {}; // Inisialisasi object kosong

      // Filtering
      if (filter) {
        where.categoryId = filter;
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

      const { count, rows } = await Article.findAndCountAll(paramsQuerySQL);

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

  static async getCategory(req, res, next) {
    try {
      const category = await Category.findAll()

      res.json(category)
    } catch (err) {
      next(err)
    }
  }

  static async getArticleById(req, res, next) {
    try {
      const articleId = +req.params.id;

      const article = await Article.findByPk(articleId);

      if (!article) {
        throw {
          name: `NotFound`,
          message: `Movies with id ${articleId} not found`,
        };
      }

      res.json(article);
    } catch (err) {
      next(err);
    }
  }
};
