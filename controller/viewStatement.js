const dbPool = require("../config/db");

exports.viewStatement = async (req, res) => {
  try {
    // Validate and sanitize inputs
    const loanId = parseInt(req.params.loan_id);
    const customerId = parseInt(req.params.customer_id);

    if (isNaN(loanId) || isNaN(customerId)) {
      return res.status(400).json({ error: "Invalid loan_id or customer_id" });
    }

    // Retrieve loan data from the database using a promise-based function
    const [loanData] = await dbQuery(
      "SELECT * FROM loan_data WHERE loan_id = ? AND customer_id = ?",
      [loanId, customerId]
    );

    if (loanData.length === 0) {
      return res.status(404).json({ error: "Loan data not found" });
    }

    // Successfully retrieved loan data

    const amountPaid = loanData.EMIs_paid_on_Time * loanData.monthly_payment;
    const EMIsLeft = loanData.tenure - loanData.EMIs_paid_on_Time;

    return res.json({
      customer_id: loanData.customer_id,
      loan_id: loanData.loan_id,
      principal_amount: loanData.loan_amount,
      interest_rate: loanData.interest_rate,
      amount_paid: amountPaid,
      monthly_installment: loanData.monthly_payment,
      repayments_left: EMIsLeft,
    });
  } catch (error) {
    console.error("Error fetching loan data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Define a helper function to execute database queries and return a promise
function dbQuery(sql, params) {
  return new Promise((resolve, reject) => {
    dbPool.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}
