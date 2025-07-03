const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET ;

// helper untuk bikin token
const signToken = (obj) => {
  return jwt.sign(obj, JWT_SECRET);
};

// helper untuk verifikasi token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  signToken,
  verifyToken
};
