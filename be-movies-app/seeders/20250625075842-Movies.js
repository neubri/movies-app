'use strict';
const axios = require('axios');
require('dotenv').config();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  async up(queryInterface, Sequelize) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;
    const genreId = 16; // 🎬 ganti ke "Animation" atau lainnya (16 = Animation, 18 = Drama, 28 = Action)
    const totalPages = 50; // 50 pages × 20 results/page ≈ 1000 movies
    const movies = [];

    try {
      for (let page = 1; page <= totalPages; page++) {
        console.log(`Fetching page ${page}...`);

        const res = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
          headers: {
            Authorization: token,
          },
          params: {
            with_genres: genreId,
            sort_by: 'popularity.desc',
            page,
          },
        });

        for (const movie of res.data.results) {
          if (movie.poster_path && movie.release_date && movie.overview) {
            movies.push({
              title: movie.title,
              overview: movie.overview,
              posterPath: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              releaseDate: movie.release_date,
              rating: movie.vote_average,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }

        // Delay 500ms between requests to avoid rate limit
        await delay(500);
      }

      await queryInterface.bulkInsert('Movies', movies);
      console.log(`✅ Seeded ${movies.length} movies successfully.`);
    } catch (error) {
      console.error('❌ Error seeding TMDB movies:', error?.response?.data || error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Movies', null, {});
  },
};
