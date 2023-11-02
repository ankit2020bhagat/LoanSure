const dbPool = require("../config/db");
const { calculateFinalAmount } = require("./helper");

const dbQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    dbPool.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

exports.makePayment = async (req, res) => {
  try {
    const loanId = parseInt(req.params.loan_id);
    const customerId = parseInt(req.params.customer_id);
    const payment = parseFloat(req.body.payment);

    if (isNaN(loanId) || isNaN(customerId) || isNaN(payment)) {
      return res
        .status(400)
        .json({ error: "Invalid loan_id, customer_id, or payment" });
    }

    const [loanData] = await dbQuery(
      "SELECT * FROM loan_data WHERE loan_id = ? AND customer_id = ?",
      [loanId, customerId]
    );

    if (!loanData) {
      return res.status(404).json({ error: "Loan data not found" });
    }

    const finalAmount = calculateFinalAmount(
      loanData.loan_amount,
      loanData.interest_rate,
      loanData.tenure
    );

    let amountLeft =
      finalAmount - loanData.EMIs_paid_on_Time * loanData.monthly_payment;

    let EMI = loanData.monthly_payment;
    const LeftEmi = loanData.tenure - loanData.EMIs_paid_on_Time;

    if (payment > loanData.monthly_payment) {
      const rem = payment - loanData.monthly_payment;
      amountLeft = amountLeft - rem;
      EMI = amountLeft / LeftEmi;
    } else {
      const underPaid = loanData.monthly_payment - payment;
      amountLeft = amountLeft + underPaid;
      EMI = amountLeft / LeftEmi;
    }
    EMI = Number(EMI.toFixed(2));

    return res.json({ Message: `Your next month EMI will be  ${EMI}` });
  } catch (err) {
    console.error("Error processing payment:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
