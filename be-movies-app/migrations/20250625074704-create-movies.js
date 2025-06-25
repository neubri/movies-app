'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Movies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      overview: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      posterPath: {
        type: Sequelize.STRING,
        allowNull: true
      },
      backdropPath: {
        type: Sequelize.STRING,
        allowNull: true
      },
      releaseDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rating: {
        type: Sequelize.FLOAT,
        allowNull: true,
        validate: {
          min: 0,
          max: 10
        }
      },
      genre: {
        type: Sequelize.STRING,
        allowNull: true
      },
      tmdbId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true
      },
      popularity: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      voteCount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('Movies', ['title']);
    await queryInterface.addIndex('Movies', ['genre']);
    await queryInterface.addIndex('Movies', ['rating']);
    await queryInterface.addIndex('Movies', ['releaseDate']);
    await queryInterface.addIndex('Movies', ['tmdbId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Movies');
  }
};
