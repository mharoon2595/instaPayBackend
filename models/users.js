const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = new Schema({
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
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  cards: [{ type: mongoose.Types.ObjectId, required: true, ref: "Card" }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
