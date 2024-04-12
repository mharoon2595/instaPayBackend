const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const Card = require("../models/card");
const User = require("../models/users");
const { default: mongoose } = require("mongoose");
const statementGenerator = require("../statementGenerator");
const card = require("../models/card");

const vendor = [
  { name: "Flipkart", type: "E-Commerce" },
  { name: "Amazon", type: "E-Commerce" },
  { name: "Lulu Hypermarket", type: "Groceries" },
  { name: "Paragon Restaurant", type: "Dining" },
  { name: "Netmeds", type: "Medicines" },
  { name: "PVR", type: "Movies" },
  { name: "College fees", type: "Education" },
  { name: "School fees", type: "Education" },
  { name: "MakeMyTrip", type: "Travel" },
];

const addTransaction = () => {
  const transactions = [];
  let sum = 0;
  for (let k = 1; k < Math.floor(Math.random() * 8 + 1); k++) {
    const vendorIndex = Math.floor(Math.random() * vendor.length);
    const transaction = {
      vendor: vendor[vendorIndex].name,
      category: vendor[vendorIndex].type,
      amount: Math.floor(Math.random() * 1000),
      type: "Debit",
    };
    transactions.push(transaction);
  }

  transactions.forEach((item) => (sum += item.amount));

  return { transactions: transactions, finalAmount: sum };
};

function isValidCreditCardNumber(cardNumber) {
  cardNumber = cardNumber.replace(/\D/g, "");

  const digits = cardNumber.split("").map(Number);

  for (let i = digits.length - 2; i >= 0; i -= 2) {
    let digit = digits[i];
    digit *= 2;
    if (digit > 9) {
      digit -= 9;
    }
    digits[i] = digit;
  }

  const sum = digits.reduce((acc, digit) => acc + digit, 0);

  return sum % 10 === 0;
}

function getCreditCardIssuer(cardNumber) {
  cardNumber = cardNumber.replace(/\D/g, "");

  const visaRegex = /^4/;
  const mastercardRegex = /^5[1-5]/;
  const amexRegex = /^3[47]/;
  const discoverRegex = /^6(?:011|5[0-9]{2})/;
  const dinersClubRegex = /^3(?:0[0-5]|[68][0-9])/;

  if (cardNumber.match(visaRegex)) {
    return "Visa";
  } else if (cardNumber.match(mastercardRegex)) {
    return "Mastercard";
  } else if (cardNumber.match(amexRegex)) {
    return "American Express";
  } else if (cardNumber.match(discoverRegex)) {
    return "Discover";
  } else if (cardNumber.match(dinersClubRegex)) {
    return "Diners Club / Carte Blanche";
  } else {
    return "Unknown";
  }
}

const getCards = async (req, res, next) => {
  const id = req.params.id;
  let cards;

  console.log("UserId--->", id);

  try {
    cards = await Card.find({ owner: id });
  } catch (err) {
    const error = new HttpError(
      "Fetching cards failed, please try again later",
      500
    );
    return next(error);
  }

  if (!cards) {
    return next(
      new HttpError(
        "Could not find cards linked to your account, let's add one now",
        404
      )
    );
  }

  const lastBillGeneratedMonth = (card) => {
    const monthNum =
      card.statements[card.statements.length - 1].month[
        card.statements[card.statements.length - 1].month.length - 1
      ].month;
    return parseInt(monthNum);
  };

  const lastBillGeneratedYear = (card) =>
    card.statements[card.statements.length - 1].month;

  const currentMonth = new Date().getMonth();

  try {
    const allPromises = cards.map(async (card) => {
      if (lastBillGeneratedMonth(card) != currentMonth) {
        const newTransaction = addTransaction();
        lastBillGeneratedYear(card).push({
          month: currentMonth,
          transactions: newTransaction.transactions,
        });
        card.outstandingAmount = newTransaction.finalAmount;
        return card.save();
      }
    });
    await Promise.all(allPromises);
  } catch (err) {
    return next(err);
  }

  res.json({
    cards: cards.map((card) => card.toObject({ getters: true })),
  });
};

const addCard = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    console.log(error);
    const err = new HttpError("Invalid input, please try again", 422);
    return next(err);
  }

  const { name, expiry, number, type } = req.body;

  let digits = isValidCreditCardNumber(number);

  if (!digits) {
    const error = new HttpError("Invalid card number, please try again", 422);
    return next(error);
  }

  const statementsData = statementGenerator();
  console.log("DATA--->", statementsData);

  const newCard = new Card({
    name: name,
    expiry: expiry,
    number: number,
    type: type,
    owner: req.userData.userId,
    limit: 100000,
    statements: statementsData.data,
    outstandingAmount: statementsData.outstandingAmount,
  });

  console.log("card model--->", newCard);

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (error) {
    return next(new HttpError("Unable to find user, please login again"));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newCard.save({ session: sess });
    user.cards.push(newCard);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Adding card failed, please check your details and try again"
    );
    return next(err);
  }

  res.status(201).json({ card: getCreditCardIssuer(number) + " card added" });
};

const fetchStatement = async (req, res, next) => {
  const id = req.params.id;
  const year = req.params.year;
  const month = req.params.month;

  console.log("params-->", id, year, month);

  let card;
  try {
    card = await Card.findById(id);
  } catch (err) {
    const error = new HttpError(
      "Statement could not be fetched at this time, please try again later."
    );
    return next(error);
  }

  const statementYear = card.statements.find((arr) => arr.year == year);
  console.log("statementYear-->", statementYear);
  const statementMonth = statementYear.month.find((arr) => arr.month == month);
  console.log("statementMonth-->", statementMonth);
  const finalStatement = statementMonth.transactions;

  res.status(201).json({ transactionsList: finalStatement });
};

const updateStatement = async (req, res, next) => {
  const id = req.params.id;
  const year = req.params.year;
  const month = req.params.month;

  let { credit } = req.body;

  console.log("params-->", id, year, month);

  let card;
  try {
    card = await Card.findById(id);
  } catch (err) {
    const error = new HttpError(
      "Statement could not be fetched at this time, please try again later."
    );
    return next(error);
  }

  const statementYear = card.statements.find((arr) => arr.year == year);
  const statementMonth = statementYear.month.find((arr) => arr.month == month);
  const finalStatement = statementMonth.transactions;

  finalStatement.push(credit);
  console.log("final credit--->", credit);

  try {
    await card.save();
  } catch (err) {
    return next(
      new HttpError(
        "Unable to update transactions list, please try again later",
        500
      )
    );
  }

  res.status(201).json({ transactionsList: finalStatement });
};

const payBill = async (req, res, next) => {
  const id = req.params.id;

  const { amount } = req.body;

  console.log("YOYOYOYO--->", id, amount);

  let card;
  try {
    card = await Card.findById(id);
    if (!card) {
      return next(new HttpError("Card not found", 422));
    }

    card.outstandingAmount -= amount;
    card = await card.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, please try again later", 500)
    );
  }

  res.status(200).json({ message: "Payment succesful", card: card.id });
};

const deleteCard = async (req, res, next) => {
  const id = req.params.id;

  console.log("HITTINGG!!!", id);

  let card;
  try {
    card = await Card.findById(id).populate("owner");
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }

  if (card.owner.id !== req.userData.userId) {
    return next(new HttpError("You are not allowed to delete this card", 401));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await card.deleteOne({ session: sess });
    await card.owner.cards.pull(card);
    await card.owner.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(
      new HttpError("Card couldn't be deleted, please try again later", 500)
    );
  }

  res.status(200).json({ message: "Card deleted" });
};

exports.addCard = addCard;
exports.getCards = getCards;
exports.fetchStatement = fetchStatement;
exports.payBill = payBill;
exports.updateStatement = updateStatement;
exports.deleteCard = deleteCard;
