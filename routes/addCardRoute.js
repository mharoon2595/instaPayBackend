const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  addCard,
  getCards,
  fetchStatement,
  payBill,
  updateStatement,
  deleteCard,
} = require("../controllers/cardController");

const auth = require("../middleware/auth");

router.get("/:id", getCards);

router.use(auth);
router.get("/:id/statements/:year/:month", fetchStatement);

router.post(
  "/add",
  [
    check("name").not().isEmpty(),
    check("expiry").not().isEmpty(),
    check("number").not().isEmpty(),
  ],
  addCard
);

router.post("/:id/statements/:year/:month", updateStatement);

router.post("/:id/pay", payBill);

router.delete("/:id/delete", deleteCard);

module.exports = router;
