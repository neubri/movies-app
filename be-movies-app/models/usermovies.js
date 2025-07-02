'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserMovies extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserMovies.belongsTo(models.User);
      UserMovies.belongsTo(models.Movie);
    }
  }
  UserMovies.init({
    userId: DataTypes.INTEGER,
    movieId: DataTypes.INTEGER,
    type: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UserMovies',
  });
  return UserMovies;
};
