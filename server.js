const express = require("express");
const bodyParser = require("body-parser");
const apiRoutes = require("./routes/route.js");
// create express app
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// define a simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Loan Sure" });
});
app.use("/", apiRoutes);
// listen for requests
app.listen(4000, () => {
  console.log("Server is listening on port 4000");
});
