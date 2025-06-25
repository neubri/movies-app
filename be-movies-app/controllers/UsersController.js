const { comparePassword } = require('../helpers/bcrypt')
const { signToken } = require('../helpers/jwt')
const { User } = require('../models')

module.exports = class UsersController {
  static async addUser(req, res, next) {
    try {
      //ambil data req.body lurr
      const { email, password, phoneNumber, address } = req.body

      //create user baru lurr
      const user = await User.create({
        email,
        password,
        phoneNumber,
        address
      })

      //hapus password dari obj lurr
      const cleanUser = user.toJSON()
      delete cleanUser.password

      //response: user yang dicreate/message
      res.status(201).json(cleanUser)
    } catch (err) {
      // console.log(err, "<<< error add user")
      next(err)
    }
  }

  static async login(req, res, next) {
    try {
      // ambil req.body
      const { email, password } = req.body

      // check/valdiasi req.body
      if (!email) {
        throw { name: "BadRequest", message: "Email is required" }
      }
      if (!password) {
        throw { name: "BadRequest", message: "Password is required" }
      }

      // check emailnya ada beneran ga lurr?
      const user = await User.findOne({
        where: { email }
      })

      // console.log(user, "<<< user");

      if (!user) {
        throw { name: "Unauthorized", message: "Invalid email/password" }
      }

      const isPasswordMatch = comparePassword(password, user.password)

      if (!isPasswordMatch) {
        throw { name: "Unauthorized", message: "Invalid email/password" }
      }

      const access_token = signToken({ id: user.id })

      // hapus password dari user obj
      const cleanUser = user.toJSON()
      delete cleanUser.password

      res.status(200).json({ access_token, user: cleanUser })
    } catch (err) {
      // console.log(err, "<<< error dari loginnn");
      next(err)
    }
  }
}
