const bodyParser = require("body-parser");
const express = require("express");
const { default: mongoose } = require("mongoose");
const userRoute = require("./routes/users-routes");
const HttpError = require("./models/http-error");
const cardsRoute = require("./routes/addCardRoute");
const cors = require("cors");

const app = express();
app.use(cors());

app.use(bodyParser.json());

app.use("/users", userRoute);
app.use("/cards", cardsRoute);

app.use((req, res, next) => {
  const error = new HttpError("Unsupported route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error occured" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.inzlklw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    console.log("Connected to server!");
    app.listen(8000);
  })
  .catch((err) => {
    console.log(err);
  });
