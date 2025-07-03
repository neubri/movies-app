const { Op } = require("sequelize");
const { Movie, User, UserRecommendations, Genre } = require("../models");
const { generateRecommendationIds } = require('../helpers/gemini');

class MoviesController {
  static async getMovies(req, res, next) {
    try {
      console.log("Query params:", req.query);
      const { search, filter, sort } = req.query;

      // Default limit and page number
      let limit = 10;
      let pageNumber = 1;

      // Parse pagination parameters - support both formats
      // Format 1: page[size]=5&page[number]=2
      if (req.query['page[size]']) {
        const parsedSize = Number(req.query['page[size]']);
        if (!isNaN(parsedSize) && parsedSize > 0) {
          limit = parsedSize;
        }
      }

      if (req.query['page[number]']) {
        const parsedPage = Number(req.query['page[number]']);
        if (!isNaN(parsedPage) && parsedPage > 0) {
          pageNumber = parsedPage;
        }
      }

      // Format 2: page.size=5&page.number=2
      if (req.query['page.size']) {
        const parsedSize = Number(req.query['page.size']);
        if (!isNaN(parsedSize) && parsedSize > 0) {
          limit = parsedSize;
        }
      }

      if (req.query['page.number']) {
        const parsedPage = Number(req.query['page.number']);
        if (!isNaN(parsedPage) && parsedPage > 0) {
          pageNumber = parsedPage;
        }
      }

      // Format 3: Direct page object (for tests using supertest)
      if (req.query.page) {
        if (req.query.page.size) {
          const parsedSize = Number(req.query.page.size);
          if (!isNaN(parsedSize) && parsedSize > 0) {
            limit = parsedSize;
          }
        }
        if (req.query.page.number) {
          const parsedPage = Number(req.query.page.number);
          if (!isNaN(parsedPage) && parsedPage > 0) {
            pageNumber = parsedPage;
          }
        }
      }

      const where = {};

      // Handle search
      if (search) {
        where.title = {
          [Op.iLike]: `%${search}%`
        };
      }

      // Handle filter by genre
      if (filter) {
        where.genreIds = {
          [Op.like]: `%${filter}%`
        };
      }

      // Calculate offset
      const offset = limit * (pageNumber - 1);

      const paramsQuerySQL = {
        where,
        limit,
        offset,
        distinct: true
      };

      // Handle sorting
      if (sort) {
        const ordering = sort[0] === "-" ? "DESC" : "ASC";
        const columnName = ordering === "DESC" ? sort.slice(1) : sort;
        paramsQuerySQL.order = [[columnName, ordering]];
      } else {
        paramsQuerySQL.order = [['title', 'ASC']]; // default sort
      }

      const { count, rows } = await Movie.findAndCountAll(paramsQuerySQL);

      // Format response
      res.status(200).json({
        statusCode: 200,
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
      const { id } = req.params;

      const movie = await Movie.findByPk(id);

      if (!movie) {
        throw { name: "NotFound", message: `Movie with id ${id} not found` };
      }

      res.status(200).json({
        statusCode: 200,
        data: {
          movie
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id;

      // Get user with preferred genres
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'preferredGenres']
      });

      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      // Check if user has preferred genres set
      if (!user.preferredGenres || user.preferredGenres.trim() === '') {
        return res.status(200).json({
          statusCode: 200,
          message: "Please set your preferred genres to get personalized recommendations",
          data: {
            recommendations: [],
            totalRecommendations: 0
          }
        });
      }

      // Parse preferred genres (stored as comma-separated string)
      const preferredGenreNames = user.preferredGenres
        .split(',')
        .map(genre => genre.trim())
        .filter(genre => genre.length > 0);

      if (preferredGenreNames.length === 0) {
        return res.status(200).json({
          statusCode: 200,
          message: "Please set valid preferred genres to get personalized recommendations",
          data: {
            recommendations: [],
            totalRecommendations: 0
          }
        });
      }

      // Get all movies from database with relevant information for AI processing
      const movies = await Movie.findAll({
        attributes: ['id', 'title', 'overview', 'posterPath', 'releaseDate', 'genreIds'],
        order: [['id', 'DESC']]
      });

      if (movies.length === 0) {
        return res.status(200).json({
          statusCode: 200,
          message: "No movies available for recommendations",
          data: {
            recommendations: [],
            totalRecommendations: 0
          }
        });
      }

      // Transform movies for AI processing
      const movieDataForAI = movies.map(movie => ({
        id: movie.id,
        title: movie.title,
        genreIds: movie.genreIds || ''
      }));

      // Get recommendations from Gemini AI
      const recommendedMovieIds = await generateRecommendationIds(
        preferredGenreNames,
        movieDataForAI
      );

      if (!recommendedMovieIds || recommendedMovieIds.length === 0) {
        return res.status(200).json({
          statusCode: 200,
          message: "Could not generate recommendations at this time",
          data: {
            recommendations: [],
            totalRecommendations: 0
          }
        });
      }

      // Fetch full details of recommended movies
      const recommendedMovies = await Movie.findAll({
        where: { id: recommendedMovieIds },
        attributes: ['id', 'title', 'overview', 'posterPath', 'releaseDate', 'genreIds']
      });

      // Sort movies according to AI recommendation order
      const sortedRecommendations = recommendedMovieIds
        .map(id => recommendedMovies.find(movie => movie.id === id))
        .filter(Boolean);

      // Store recommendations in database for reference
      await MoviesController._saveUserRecommendations(
        userId,
        sortedRecommendations,
        preferredGenreNames.join(', ')
      );

      // Get genre names for all recommended movies
      const allGenreIds = new Set();
      sortedRecommendations.forEach(movie => {
        if (movie.genreIds) {
          const ids = movie.genreIds.split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id) && id > 0); // Filter out NaN and invalid IDs
          ids.forEach(id => allGenreIds.add(id));
        }
      });

      // Fetch genre data for display
      const genres = await Genre.findAll({
        where: { id: Array.from(allGenreIds) },
        attributes: ['id', 'name']
      });

      // Map genre IDs to names for response
      const genreMap = new Map(genres.map(genre => [genre.id, genre.name]));

      // Format recommendations with genre names
      const formattedRecommendations = sortedRecommendations.map(movie => {
        const movieGenres = movie.genreIds
          ? movie.genreIds.split(',')
              .map(id => parseInt(id.trim()))
              .filter(id => !isNaN(id) && id > 0) // Filter out NaN and invalid IDs
              .map(id => genreMap.get(id))
              .filter(Boolean)
          : [];

        return {
          ...movie.toJSON(),
          genres: movieGenres
        };
      });

      return res.status(200).json({
        statusCode: 200,
        message: "Recommendations generated successfully",
        data: {
          recommendations: formattedRecommendations,
          totalRecommendations: formattedRecommendations.length,
          basedOnGenres: preferredGenreNames,
          generatedAt: new Date().toISOString(),
          method: "gemini"
        }
      });

    } catch (error) {
      console.error('Error in getRecommendations:', error);

      if (error.name === 'NotFound') {
        next(error);
      } else if (error.message && error.message.includes('GEMINI_API_KEY')) {
        next({
          name: "InternalServerError",
          message: "Recommendation service temporarily unavailable"
        });
      } else {
        next({
          name: "InternalServerError",
          message: "Error generating recommendations"
        });
      }
    }
  }

  /**
   * Get the user's recommendation history
   */
  static async getRecommendationHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;

      const { count, rows } = await UserRecommendations.findAndCountAll({
        where: { userId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [{
          model: Movie,
          attributes: ['id', 'title', 'posterPath', 'overview', 'releaseDate', 'genreIds']
        }]
      });

      // Get all genre IDs from the recommendations
      const allGenreIds = new Set();
      rows.forEach(recommendation => {
        if (recommendation.Movie?.genreIds) {
          const ids = recommendation.Movie.genreIds.split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id) && id > 0); // Filter out NaN and invalid IDs
          ids.forEach(id => allGenreIds.add(id));
        }
      });

      // Fetch genre data
      const genres = await Genre.findAll({
        where: { id: Array.from(allGenreIds) },
        attributes: ['id', 'name']
      });

      // Map genre IDs to names
      const genreMap = new Map(genres.map(genre => [genre.id, genre.name]));

      // Format recommendations with genre names
      const formattedHistory = rows.map(recommendation => {
        const movie = recommendation.Movie;

        if (!movie) {
          return { ...recommendation.toJSON(), Movie: null };
        }

        const movieGenres = movie.genreIds
          ? movie.genreIds.split(',')
              .map(id => parseInt(id.trim()))
              .filter(id => !isNaN(id) && id > 0) // Filter out NaN and invalid IDs
              .map(id => genreMap.get(id))
              .filter(Boolean)
          : [];

        return {
          ...recommendation.toJSON(),
          Movie: {
            ...movie.toJSON(),
            genres: movieGenres
          }
        };
      });

      return res.status(200).json({
        statusCode: 200,
        data: {
          recommendations: formattedHistory,
          pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Error in getRecommendationHistory:', error);
      next({
        name: "InternalServerError",
        message: "Error retrieving recommendation history"
      });
    }
  }

  /**
   * Private helper method to save user recommendations to database
   * @param {number} userId - User ID
   * @param {Array} movies - Array of recommended movies
   * @param {string} genreContext - String of genres used for recommendations
   */
  static async _saveUserRecommendations(userId, movies, genreContext) {
    try {
      // Remove existing recommendations
      await UserRecommendations.destroy({
        where: { userId }
      });

      // Create new recommendation records
      if (movies && movies.length > 0) {
        const recommendations = movies.map(movie => ({
          userId,
          movieId: movie.id,
          reason: `Recommended based on your interest in ${genreContext}`
        }));

        await UserRecommendations.bulkCreate(recommendations);
      }
    } catch (error) {
      console.error('Error saving user recommendations:', error);
      // Non-critical operation, so we just log the error
    }
  }
}

module.exports = MoviesController;
