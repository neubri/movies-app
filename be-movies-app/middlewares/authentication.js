const { User } = require('../models');
const { comparePassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports = class UserController {
  static async register(req, res, next) {
    try {
      const { email, password, favoriteGenre } = req.body;

      // Validation
      if (!email) {
        throw { name: "BadRequest", message: "Email is required" };
      }
      if (!password) {
        throw { name: "BadRequest", message: "Password is required" };
      }
      if (!favoriteGenre) {
        throw { name: "BadRequest", message: "Favorite genre is required" };
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw { name: "BadRequest", message: "Email already registered" };
      }

      const user = await User.create({
        email,
        password,
        favoriteGenre
      });

      const cleanUser = user.toJSON();
      delete cleanUser.password;

      const access_token = signToken({ id: user.id });

      res.status(201).json({
        message: "User registered successfully",
        access_token,
        user: cleanUser
      });
    } catch (err) {
      next(err);
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

      const user = await User.findOne({ where: { email } });

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

      res.status(200).json({
        message: "Login successful",
        access_token,
        user: cleanUser
      });
    } catch (err) {
      next(err);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        throw { name: "BadRequest", message: "Google token is required" };
      }

      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name, picture } = payload;

      let user = await User.findOne({ where: { email } });

      if (!user) {
        // Create new user with Google account
        user = await User.create({
          email,
          password: `google_${Date.now()}`, // Dummy password for Google users
          favoriteGenre: 'Action', // Default genre, user can change later
          name,
          profilePicture: picture,
          isGoogleUser: true
        });
      }

      const access_token = signToken({ id: user.id });

      const cleanUser = user.toJSON();
      delete cleanUser.password;

      res.status(200).json({
        message: "Google login successful",
        access_token,
        user: cleanUser
      });
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      res.json({
        message: "Profile retrieved successfully",
        user
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { favoriteGenre, name } = req.body;

      const user = await User.findByPk(userId);

      if (!user) {
        throw { name: "NotFound", message: "User not found" };
      }

      const updateData = {};
      if (favoriteGenre) updateData.favoriteGenre = favoriteGenre;
      if (name) updateData.name = name;

      await user.update(updateData);

      const updatedUser = user.toJSON();
      delete updatedUser.password;

      res.json({
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (err) {
      next(err);
    }
  }
};
