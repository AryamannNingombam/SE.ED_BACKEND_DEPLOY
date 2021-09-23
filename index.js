require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const portNumber = 8010;

const mongoose = require("mongoose");

const UserRoutes = require("./routes/UserRoutes");
const WritingRoutes = require("./routes/WritingRoutes");



mongoose
  .connect(
    process.env.MONGO_DB_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then((client) => {
    console.log("Connected!");

    app.get("/", (req, res, next) => {
      console.log("Works!!");
      return res.json({
        success: true,
      });
    });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors());


    app.listen(portNumber, () => {
      console.log("Listening on " + portNumber.toString());
    });

    app.use("/writing-routes", WritingRoutes);
    app.use("/user-routes", UserRoutes);
    app.use("/uploads", express.static("uploads"));
  })
  .catch((e) => {
    console.log("ERROR!");
    console.log(e);
  });
