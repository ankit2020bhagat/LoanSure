module.exports = (app) => {
  const { register, findAll } = require("../controller/db.js");
  const { createLoan } = require("../controller/createLoan.js");
  const { checkEligibility } = require("../controller/checkEligibility.js");
  const { viewLoan } = require("../controller/viewLoan.js");
  const { makePayment } = require("../controller/makePayment.js");
  //Create a new todo
  const { viewStatement } = require("../controller/viewStatement.js");
  app.post("/register", register);

  // Retrieve all todos
  app.get("/get", findAll);

  app.get("/check-eligibility", checkEligibility);

  app.post("/create-loan", createLoan);

  app.get("/view-loan/:loan_id", viewLoan);

  app.get("/view-statement/:customer_id/:loan_id", viewStatement);

  app.put("/make-payment/:customer_id/:loan_id", makePayment);
};
