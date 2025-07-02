'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserRecommendations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserRecommendations.belongsTo(models.User);
      UserRecommendations.belongsTo(models.Movie);
    }
  }
  UserRecommendations.init({
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    },
    movieId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Movies',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    },
    reason: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'UserRecommendations',
  });
  return UserRecommendations;
};
