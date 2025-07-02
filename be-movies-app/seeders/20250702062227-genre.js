'use strict';

const axios = require('axios');
require('dotenv').config();

module.exports = {
  async up(queryInterface, Sequelize) {
    const headers = {
      Authorization: process.env.TMDB_READ_TOKEN
    };

    try {
      const { data } = await axios.get(
        'https://api.themoviedb.org/3/genre/movie/list?language=en-US',
        { headers }
      );

      const genres = data.genres.map((genre) => ({
        id: genre.id,
        name: genre.name,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      return queryInterface.bulkInsert('Genres', genres);
    } catch (err) {
      console.error('❌ Error seeding genres:', err.response?.data || err.message);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Genres', null, {});
  }
};
