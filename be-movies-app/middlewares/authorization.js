const { Article } = require('../models')

function isAdmin(req, res, next) {
  try {
    if( req.user.role !== 'Admin') {
      throw { name: "Forbidden", message: "You are not authorized" }
    }

    next()
  } catch (err) {
    next (err)
  }
}

async function isAdminOrStaff(req, res, next) {
  try {
    if (req.user.role === 'Admin') {
      return next()
    }

    //ambil article id nya
    const articleId = +req.params.id

    const userId = req.user.id
    const article = await Article.findByPk(articleId)

    if(!article){
      throw ({ name: `NotFound`, message: `Article with id ${articleId} not found` })
    }

    if(article.authorId !== userId) {
      throw { name: "Forbidden", message: "You are not authorized" }
    }

    next()
  } catch (err) {
    console.log(err)

    next(err)
  }
}

module.exports = {
  isAdmin,
  isAdminOrStaff
}
