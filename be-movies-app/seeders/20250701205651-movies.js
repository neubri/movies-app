"use strict";

const axios = require("axios");
require("dotenv").config();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const allMovies = [];
      const headers = {
        Authorization: process.env.TMDB_READ_TOKEN,
      };

      // 500 pages × 20 results = 10,000 movies
      for (let page = 1; page <= 500; page++) {
        console.log(`🔥 Fetching page ${page}/500 from TMDB`);

        const { data } = await axios.get(
          `https://api.themoviedb.org/3/movie/popular?page=${page}`,
          { headers }
        );

        const movies = data.results
        .filter((movie) => movie.title && movie.poster_path) // Hanya movie yang ada judul + poster
        .map((movie) => ({
          tmdbId: movie.id,
          title: movie.title,
          overview: movie.overview,
          posterPath: movie.poster_path,
          releaseDate:
            movie.release_date && movie.release_date.trim() !== ""
              ? movie.release_date
              : null,
          genreIds: JSON.stringify(movie.genre_ids || []),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        allMovies.push(...movies);

        // Delay tiap 5 page untuk menghindari rate limit
        if (page % 5 === 0) await delay(1500);
      }

      console.log(`💾 Seeding ${allMovies.length} movies to database...`);
      await queryInterface.bulkInsert("Movies", allMovies, {
        ignoreDuplicates: true,
      });

      console.log(`✅ Done. Total: ${allMovies.length} movies`);
    } catch (err) {
      console.error("❌ Error while seeding movies:", err);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Movies", null, {});
  },
};
