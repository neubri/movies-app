const { GoogleGenerativeAI } = require('@google/generative-ai');
const { User, Movie, Favorite } = require('../models');
const { Op } = require('sequelize');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = class RecommendationController {
  static async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id;
      const { genre: requestedGenre } = req.body;

      // Get user's favorite genre
      const user = await User.findByPk(userId, {
        attributes: ['favoriteGenre', 'email']
      });

      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      // Use requested genre or user's favorite genre
      const targetGenre = requestedGenre || user.favoriteGenre;

      // Get user's favorite movies to understand preferences
      const userFavorites = await Favorite.findAll({
        where: { userId },
        include: [
          {
            model: Movie,
            attributes: ['title', 'genre', 'overview', 'rating']
          }
        ],
        limit: 10,
        order: [['createdAt', 'DESC']]
      });

      const favoriteMovieTitles = userFavorites.map(fav => fav.Movie.title);

      // Create prompt for Gemini AI
      const prompt = this.createRecommendationPrompt(targetGenre, favoriteMovieTitles);

      // Get AI recommendations
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiRecommendations = response.text();

      // Parse AI response to extract movie titles
      const recommendedTitles = this.parseAIRecommendations(aiRecommendations);

      // Find matching movies in database
      const matchingMovies = await Movie.findAll({
        where: {
          title: {
            [Op.iLike]: {
              [Op.any]: recommendedTitles.map(title => `%${title}%`)
            }
          }
        },
        include: [
          {
            model: Favorite,
            where: { userId },
            required: false,
            attributes: ['id']
          }
        ],
        limit: 10
      });

      // If not enough matches, get movies from the same genre
      let additionalMovies = [];
      if (matchingMovies.length < 5) {
        additionalMovies = await Movie.findAll({
          where: {
            genre: { [Op.iLike]: `%${targetGenre}%` },
            id: { [Op.notIn]: matchingMovies.map(m => m.id) }
          },
          include: [
            {
              model: Favorite,
              where: { userId },
              required: false,
              attributes: ['id']
            }
          ],
          order: [['rating', 'DESC']],
          limit: 5 - matchingMovies.length
        });
      }

      const allRecommendations = [...matchingMovies, ...additionalMovies];

      // Add isFavorite flag
      const recommendationsWithFavoriteFlag = allRecommendations.map(movie => {
        const movieData = movie.toJSON();
        movieData.isFavorite = movie.Favorites && movie.Favorites.length > 0;
        delete movieData.Favorites;
        return movieData;
      });

      res.json({
        message: "AI recommendations generated successfully",
        data: {
          recommendations: recommendationsWithFavoriteFlag,
          genre: targetGenre,
          aiResponse: aiRecommendations,
          totalRecommendations: recommendationsWithFavoriteFlag.length
        }
      });

    } catch (err) {
      console.error('Recommendation error:', err);
      next(err);
    }
  }

  static createRecommendationPrompt(genre, favoriteMovies) {
    let prompt = `Give me 10 movie recommendations in the ${genre} genre. `;

    if (favoriteMovies.length > 0) {
      prompt += `The user has previously liked these movies: ${favoriteMovies.join(', ')}. `;
      prompt += `Based on their taste, recommend similar movies in the ${genre} genre. `;
    }

    prompt += `Please provide the response as a numbered list with just the movie titles, one per line. `;
    prompt += `Format: 1. Movie Title\n2. Movie Title\n etc. `;
    prompt += `Focus on popular, well-known movies that are likely to be in a movie database.`;

    return prompt;
  }

  static parseAIRecommendations(aiResponse) {
    try {
      // Extract movie titles from AI response
      const lines = aiResponse.split('\n');
      const titles = [];

      for (const line of lines) {
        // Match patterns like "1. Movie Title" or "- Movie Title" or just "Movie Title"
        const match = line.match(/^\d+\.\s*(.+)$/) ||
                     line.match(/^-\s*(.+)$/) ||
                     line.match(/^\*\s*(.+)$/) ||
                     (line.trim() && !line.includes(':') ? [null, line.trim()] : null);

        if (match && match[1]) {
          let title = match[1].trim();
          // Remove year in parentheses if present
          title = title.replace(/\s*\(\d{4}\).*$/, '');
          // Remove quotes if present
          title = title.replace(/^["']|["']$/g, '');

          if (title.length > 0 && title.length < 100) {
            titles.push(title);
          }
        }
      }

      return titles.length > 0 ? titles : ['The Dark Knight', 'Inception', 'Pulp Fiction'];
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
      // Return fallback recommendations
      return ['The Dark Knight', 'Inception', 'Pulp Fiction'];
    }
  }

  static async getPersonalizedRecommendations(req, res, next) {
    try {
      const userId = req.user.id;

      // Get user's viewing history and preferences
      const user = await User.findByPk(userId);
      const favorites = await Favorite.findAll({
        where: { userId },
        include: [Movie],
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      // Analyze user's preferences
      const genrePreferences = {};
      favorites.forEach(fav => {
        const genres = fav.Movie.genre.split(',').map(g => g.trim());
        genres.forEach(genre => {
          genrePreferences[genre] = (genrePreferences[genre] || 0) + 1;
        });
      });

      // Get top 3 preferred genres
      const topGenres = Object.entries(genrePreferences)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => genre);

      const recommendations = [];

      // Get recommendations for each top genre
      for (const genre of topGenres) {
        const genreMovies = await Movie.findAll({
          where: {
            genre: { [Op.iLike]: `%${genre}%` },
            id: { [Op.notIn]: favorites.map(f => f.movieId) }
          },
          include: [
            {
              model: Favorite,
              where: { userId },
              required: false,
              attributes: ['id']
            }
          ],
          order: [['rating', 'DESC']],
          limit: 5
        });

        recommendations.push(...genreMovies);
      }

      const uniqueRecommendations = recommendations
        .filter((movie, index, arr) =>
          arr.findIndex(m => m.id === movie.id) === index
        )
        .slice(0, 15);

      const recommendationsWithFavoriteFlag = uniqueRecommendations.map(movie => {
        const movieData = movie.toJSON();
        movieData.isFavorite = movie.Favorites && movie.Favorites.length > 0;
        delete movieData.Favorites;
        return movieData;
      });

      res.json({
        message: "Personalized recommendations generated",
        data: {
          recommendations: recommendationsWithFavoriteFlag,
          basedOnGenres: topGenres,
          totalRecommendations: recommendationsWithFavoriteFlag.length
        }
      });

    } catch (err) {
      next(err);
    }
  }
};
