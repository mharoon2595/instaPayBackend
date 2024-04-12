const mongoose = require("mongoose");
const mongooseUniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  vendor: String,
  category: String,
  type: String,
  amount: Number,
});

const monthSchema = new Schema({
  month: String,
  transactions: [transactionSchema],
});

const yearSchema = new Schema({
  year: String,
  month: [monthSchema],
});

const cardSchema = new Schema({
  name: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        const regex = /^[a-zA-Z ]*[a-zA-Z][a-zA-Z ]*$/;
        if (regex.test(value)) {
          return true;
        } else return false;
      },
      message: (props) =>
        `${props.path.name} must contain at least one alphabet`,
    },
  },
  expiry: {
    type: String,
    requried: true,
    validate: {
      validator: function (value) {
        const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
        if (!regex.test(value)) {
          return false;
        }

        const [month, year] = value.split("/").map(Number);

        if (month < 1 || month > 12) {
          return false;
        }

        const currentYear = new Date().getFullYear() % 100;
        if (
          year < currentYear ||
          (year == currentYear && month < new Date().getMonth + 1)
        ) {
          return false;
        }

        return true;
      },
      message: (props) => `${props.value} is not a valid date of expiry`,
    },
  },
  number: { type: String, required: true, minlength: 16, unique: true },
  limit: { type: Number, required: true },
  type: { type: String, required: true },
  statements: [yearSchema],
  outstandingAmount: { type: Number, required: true },
  owner: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

cardSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model("Card", cardSchema);
