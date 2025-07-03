function errorHandler(error, req, res, next) {
  console.log(error, "<<< error name");

  switch (error.name) {
    case "SequelizeValidationError":
    case "SequelizeUniqueConstraintError":
      res.status(400).json({ message: error.errors[0].message });
      break;
    case "BadRequest":
      res.status(400).json({ message: error.message });
      break;
    case "Unauthorized":
      res.status(401).json({ message: error.message });
      break;
    case "JsonWebTokenError":
      res.status(401).json({ message: "Invalid Token" });
      break;
    case "NotFound":
      res.status(404).json({ message: error.message });
      break;
    case "Forbidden":
      res.status(403).json({ message: error.message });
      break;
    case "InternalServerError":
      res.status(500).json({ message: error.message });
      break;
    default:
      res.status(500).json({ message: "Internal Server Error" });
      break;
  }
}

module.exports = errorHandler;
