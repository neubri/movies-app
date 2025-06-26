const { verifyToken } = require('../helpers/jwt');
const { User } = require('../models');

async function authentication(req, res, next) {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      throw { name: "Unauthorized", message: "Invalid Token" };
    }

    const rawToken = authorization.split(' ');
    const tokenType = rawToken[0];
    const tokenValue = rawToken[1];

    // Check token format
    if (tokenType !== 'Bearer' || !tokenValue) {
      throw { name: "Unauthorized", message: "Invalid Token" };
    }

    // Verify token
    const result = verifyToken(tokenValue);

    // Check if user exists
    const user = await User.findByPk(result.id);

    if (!user) {
      throw { name: "Unauthorized", message: "Invalid Token" };
    }

    // Attach user info to request
    req.user = user;

    next();
  } catch (err) {
    next(err);
  }
} 

module.exports = authentication;  
