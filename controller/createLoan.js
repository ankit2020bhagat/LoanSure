const dbPool = require("../config/db");
const {
  calculatePastLoansPaidOnTimeScore,
  approveLoan,
  calculateCreditScoreForLoanApprovedVolume,
  calculateCreditScoreForLoanActivityInCurrentYear,
  calculateNumberOfLoansTaken,
  calculateStartAndEndDate,
} = require("./helper");

exports.createLoan = async (req, res) => {
  try {
    const { customerID, loanAmount, interestRate, tenure } = req.body;

    if (!customerID || !loanAmount || !interestRate || !tenure) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const [loanData, customerData] = await Promise.all([
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
      loan_amount: loanAmount,
      interest_rate: interestRate,
      tenure: tenure,
      credit_score: credit_score,
      current_emis: emi,
      monthly_salary: customerData.monthly_salary,
    };

    const loanApprovalResult = approveLoan(request);

    if (loanApprovalResult.approval) {
      const tenureInMonths = tenure;
      const { startDate, endDate } = calculateStartAndEndDate(tenureInMonths);

      dbPool.query(
        "INSERT INTO loan_data (customer_id, loan_amount, interest_rate, tenure, monthly_payment, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          customerID,
          loanAmount,
          interestRate,
          tenure,
          loanApprovalResult.monthly_installment,
          startDate,
          endDate,
        ],
        function (error, results) {
          if (error) {
            console.error("Error creating loan:", error);
            return res
              .status(500)
              .json({ error: "An error occurred while creating the loan" });
          }
          return res.json({
            loan_id: results.insertId,
            customer_id: customerID,
            loan_approved: loanApprovalResult.approval,
            message: "Congratulations! Your loan has been approved",
            monthly_installment: loanApprovalResult.monthly_installment,
          });
        }
      );
    } else {
      return res.json({
        loan_id: null,
        customer_id: customerID,
        loan_approved: loanApprovalResult.approval,
        message: "Loan not approved. Please review your application.",
        monthly_installment: loanApprovalResult.monthly_installment,
      });
    }
  } catch (error) {
    console.error("Error processing loan creation:", error);
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
