const { User } = require("../models/index");
const { comparePassword, hashPassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

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

  static async googleLogin(req, res, next) {
    try {
      const { id_token } = req.body;

      if (!id_token) {
        throw { name: "BadRequest", message: "Google ID token is required" };
      }

      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      // Verify the token
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();

      // Find or create user
      let user = await User.findOne({
        where: { email: payload.email }
      });

      if (!user) {
        // Generate random password (they'll never use it since they're using Google login)
        const randomPassword = crypto.randomBytes(32).toString('hex');

        // Create username from email (remove @domain.com and add random numbers if needed)
        let username = payload.email.split('@')[0];
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
          username = `${username}${Math.floor(Math.random() * 10000)}`;
        }

        // Create new user with Google data
        user = await User.create({
          email: payload.email,
          username,
          password: randomPassword, // This will be hashed by the User model hook
          preferredGenres: null // They can set this later
        }, {
          hooks: false // Skip password hashing since we're using Google auth
        });
      }

      // Generate JWT token
      const access_token = signToken({ id: user.id });

      // Clean user object
      const cleanUser = user.toJSON();
      delete cleanUser.password;
      delete cleanUser.createdAt;
      delete cleanUser.updatedAt;
      delete cleanUser.id;

      res.status(200).json({
        access_token,
        user: cleanUser,
        message: "Google login successful"
      });

    } catch (error) {
      if (error.name === 'Error' && error.message.includes('Token used too late')) {
        error = { name: "BadRequest", message: "Invalid or expired Google token" };
      }
      next(error);
    }
  }
}

module.exports = authController;
