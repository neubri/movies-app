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
      UserMovies.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      UserMovies.belongsTo(models.Movie, {
        foreignKey: 'movieId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }
  UserMovies.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    movieId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Movies',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['favorite', 'watchlist']]
      }
    },
    status: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['pending', 'watched', null]]
      }
    }
  }, {
    sequelize,
    modelName: 'UserMovies',
  });
  return UserMovies;
};
