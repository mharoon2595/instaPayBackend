const User = require("../models/users");
const HttpError = require("../models/http-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid inputs passed, please check your data.",
      422
    );
    return next(error);
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new HttpError("Signing up failed, please try again", 500));
  }

  if (existingUser) {
    const error = new HttpError(
      "Email already exists, please login instead.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Signing up failed, please try again", 500));
  }

  const newUser = new User({
    name: name,
    email: email,
    password: hashedPassword,
    cards: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    const error = new HttpError(
      "Unable to sign up right now, please try again later.",
      500
    );
    return next(err);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.DB_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Signing in failed, please try again", 500));
  }

  console.log("HITTING SIGNUP");

  res
    .status(201)
    .json({ userId: newUser.id, name: newUser.name, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Signing in failed, please try again", 500));
  }

  if (!existingUser) {
    const error = new HttpError("User does not exist, please sign up", 403);
    return next(error);
  }

  let validPassword;
  try {
    validPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(err);
  }

  if (!validPassword) {
    return next(
      new HttpError(
        "The password you entered is incorrect, please try again",
        422
      )
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.DB_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Signing in failed, please try again", 500));
  }

  res.status(201).json({
    userId: existingUser.id,
    name: existingUser.name,
    token: token,
    message: "Logged in",
  });
};

exports.signup = signup;
exports.login = login;
