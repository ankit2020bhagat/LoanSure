const dbPool = require("../config/db");
const {
  calculatePastLoansPaidOnTimeScore,
  approveLoan,
  calculateCreditScoreForLoanApprovedVolume,
  calculateCreditScoreForLoanActivityInCurrentYear,
  calculateNumberOfLoansTaken,
} = require("./helper");

exports.checkEligibility = async (req, res) => {
  const customerID = req.body.customerID;

  if (!customerID) {
    return res.status(400).json({ error: "Customer ID is required" });
  }

  try {
    const [loanData, customerData] = await Promise.all([
      // Fetch loan data and customer data concurrently
      fetchLoanData(customerID),
      fetchCustomerData(customerID),
    ]);

    let credit_score = 0;

    const pastLoansPaidOnTimeScore =
      calculatePastLoansPaidOnTimeScore(loanData);

    credit_score += pastLoansPaidOnTimeScore;

    const numberOfLoansTaken = calculateNumberOfLoansTaken(
      loanData,
      customerID
    );

    credit_score += numberOfLoansTaken * 10;

    const currentYear = new Date().getFullYear();
    const creditScoreForLoanActivityInCurrentYear =
      calculateCreditScoreForLoanActivityInCurrentYear(loanData, currentYear);

    credit_score += creditScoreForLoanActivityInCurrentYear;

    const creditScoreForLoanApprovedVolume =
      calculateCreditScoreForLoanApprovedVolume(customerData, loanData);

    credit_score += Math.floor(creditScoreForLoanApprovedVolume);

    const emi = loanData.map((loan) => loan.monthly_payment);
    const request = {
      customer_id: customerID,
      loan_amount: req.body.loanAmount,
      interest_rate: req.body.interestRate,
      tenure: req.body.tenure,
      credit_score: credit_score,
      current_emis: emi,
      monthly_salary: customerData.monthly_salary,
    };

    const loanApprovalResult = approveLoan(request);
    res.json({ loanApprovalResult, creditScore: credit_score });
  } catch (error) {
    console.error("Error processing loan eligibility:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Helper function to fetch loan data
function fetchLoanData(customerID) {
  return new Promise((resolve, reject) => {
    dbPool.query(
      "SELECT * FROM loan_data WHERE customer_id = ?",
      [customerID],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

// Helper function to fetch customer data
function fetchCustomerData(customerID) {
  return new Promise((resolve, reject) => {
    dbPool.query(
      "SELECT * FROM customer_data WHERE customer_id = ?",
      [customerID],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results[0]);
        }
      }
    );
  });
}
