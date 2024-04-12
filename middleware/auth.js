const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  try {
    let token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return next(new HttpError("Authentication failed", 422));
    }
    let auth = jwt.verify(token, process.env.DB_KEY);
    req.userData = { userId: auth.userId };
    next();
  } catch (err) {
    return next(new HttpError("Authentication failed", 422));
  }
};
