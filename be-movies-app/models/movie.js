"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Movie extends Model {
    static associate(models) {
      Movie.hasMany(models.Favorite, { foreignKey: "movieId" });
      // Add many-to-many relationship
      Movie.belongsToMany(models.User, {
        through: models.Favorite,
        as: 'favoritedBy',
        foreignKey: 'movieId',
        otherKey: 'userId'
      });
    }
  }

  Movie.init({
    tmdbId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    overview: DataTypes.TEXT,
    releaseDate: DataTypes.DATEONLY,
    posterPath: DataTypes.STRING,
    backdropPath: DataTypes.STRING,
    voteAverage: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    voteCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    genres: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    runtime: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Movie',
  });

  return Movie;
};
