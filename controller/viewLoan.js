const dbPool = require("../config/db");

exports.viewLoan = async (req, res) => {
  try {
    const loanId = req.params.loan_id;

    // Retrieve loan data
    const loan = await queryDatabase(
      "SELECT * FROM loan_data WHERE loan_id = ?",
      [loanId]
    );

    if (loan.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    const customerId = loan[0].customer_id;

    // Retrieve customer data
    const user = await queryDatabase(
      "SELECT * FROM customer_data WHERE customer_id = ?",
      [customerId]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Successfully retrieved loan and customer data
    const response = formatLoanAndCustomerData(loan[0], user[0]);

    return res.json(response);
  } catch (error) {
    console.error("Error fetching loan or customer data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Define a function for querying the database and returning a promise
function queryDatabase(sql, params) {
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

function formatLoanAndCustomerData(loan, user) {
  return {
    loan_id: loan.loan_id,
    customer: {
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      age: user.age,
    },
    loan_amount: loan.loan_amount,
    interest_rate: loan.interest_rate,
    monthly_installment: loan.monthly_installment,
    tenure: loan.tenure,
  };
}
