const { User } = require("../models/index");
const { comparePassword  } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");

class authController {
  static async register(req, res, next) {
    try {
      const { username, email, password, preferredGenres } = req.body;

      let user = await User.create({
        username,
        email,
        password,
        preferredGenres,
      });

      user = user.toJSON();
      delete user.password;
      delete user.createdAt;
      delete user.updatedAt;
      delete user.id;

      res.status(201).json({
        message: "Create user success",
        user: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email) {
        throw { name: "BadRequest", message: "Email is required" };
      }
      if (!password) {
        throw { name: "BadRequest", message: "Password is required" };
      }

      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        throw { name: "Unauthorized", message: "Invalid email/password" };
      }

      const isPasswordMatch = comparePassword(password, user.password);

      if (!isPasswordMatch) {
        throw { name: "Unauthorized", message: "Invalid email/password" };
      }

      const access_token = signToken({ id: user.id });

      const cleanUser = user.toJSON();
      delete cleanUser.password;
      delete cleanUser.createdAt;
      delete cleanUser.updatedAt;
      delete cleanUser.id;

      res.status(200).json({ access_token, user: cleanUser });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = authController;
