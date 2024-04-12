const express = require("express");
const { check } = require("express-validator");
const { signup, login } = require("../controllers/userController");
const router = express.Router();

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").isEmail(),
    check("password").isLength({ min: 8 }),
  ],
  signup
);
router.post("/login", login);

module.exports = router;
