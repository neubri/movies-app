'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Movie extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Movie.hasMany(models.UserMovies, {
        foreignKey: 'movieId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      Movie.hasMany(models.UserRecommendations, {
        foreignKey: 'movieId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }
  Movie.init({
    tmdbId: DataTypes.INTEGER,
    title: DataTypes.STRING,
    overview: DataTypes.TEXT,
    posterPath: DataTypes.STRING,
    releaseDate: DataTypes.DATE,
    genreIds: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Movie',
  });
  return Movie;
};
