const { verifyToken } = require('../helpers/jwt')
const { User } = require('../models')

async function authentication(req, res, next) {
  try {
    const { authorization } = req.headers
    // console.log( { authorization });

    if(!authorization) {
      throw { name: "Unauthorized", message: "Invalid Token"}
    }

    const rawToken = authorization.split(' ')
    const tokenType = rawToken[0]
    const tokenValue = rawToken[1]

    //terus kita cek token nya sesuai ga sama format bearer authentication nya
    if(tokenType !== 'Bearer' || !tokenValue ) {
      throw { name: "Unauthorized", message: "Invalid Token"}
    }

    //terus kita verif token nya berasa dari aplikasi kita bukan??
    const result = verifyToken(tokenValue)
    // console.log(result, "<<< token");

    //cek apakah user id tsb ada apa ga?
    const user = await User.findByPk(result.id)

    if(!user) {
      throw { name: "Unauthorized", message: "Invalid Token"}
    }

    //attach info user nya ke request
    req.user = user

    next()
  } catch (err) {
    console.log(err);
    next(err)
  }
}

module.exports = authentication
