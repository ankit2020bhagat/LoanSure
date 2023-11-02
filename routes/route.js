// routes/api.js
const express = require("express");
const router = express.Router();
const { register } = require("../controller/register");
const { createLoan } = require("../controller/createLoan");
const { checkEligibility } = require("../controller/checkEligibility");
const { viewLoan } = require("../controller/viewLoan");
const { makePayment } = require("../controller/makePayment");
const { viewStatement } = require("../controller/viewStatement");

// Register
router.post("/register", register);

// Create a loan
router.post("/create-loan", createLoan);

// Check eligibility
router.post("/check-eligibility", checkEligibility);

// View loan
router.get("/view-loan/:loan_id", viewLoan);

// Make a payment
router.put("/make-payment/:customer_id/:loan_id", makePayment);

// View statement
router.get("/view-statement/:customer_id/:loan_id", viewStatement);

module.exports = router;
