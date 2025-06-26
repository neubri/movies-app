'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Movies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tmdbId: {
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      overview: {
        type: Sequelize.TEXT
      },
      releaseDate: {
        type: Sequelize.DATEONLY
      },
      posterPath: {
        type: Sequelize.STRING
      },
      backdropPath: {
        type: Sequelize.STRING
      },
      voteAverage: {
        type: Sequelize.FLOAT
      },
      voteCount: {
        type: Sequelize.INTEGER
      },
      genres: {
        type: Sequelize.JSON
      },
      runtime: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Movies');
  }
};