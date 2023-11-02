// Import any required modules at the top
// You can create a validation module

// Add error handling for all functions
function calculatePastLoansPaidOnTimeScore(loanData) {
  try {
    const totalLoans = loanData.length;
    const loansPaidOnTime = loanData.filter(
      (loan) => loan.EMIs_paid_on_Time === loan.tenure
    ).length;

    if (totalLoans === 0) {
      return 0;
    }

    const percentagePaidOnTime = (loansPaidOnTime / totalLoans) * 100;

    let score = 0;
    if (percentagePaidOnTime >= 80) {
      score = 20;
    } else if (percentagePaidOnTime >= 60) {
      score = 15;
    } else if (percentagePaidOnTime >= 40) {
      score = 10;
    }

    return score;
  } catch (error) {
    throw new Error(
      "Error calculating past loans paid on time score: " + error.message
    );
  }
}

function calculateNumberOfLoansTaken(loanData, customerId) {
  try {
    const loansTaken = loanData.filter(
      (loan) => loan.customer_id === customerId
    );
    return loansTaken.length;
  } catch (error) {
    throw new Error(
      "Error calculating number of loans taken: " + error.message
    );
  }
}

function calculateCreditScoreForLoanActivityInCurrentYear(
  loanData,
  currentYear
) {
  try {
    const currentYearLoans = loanData.filter((loan) => {
      const loanStartDate = new Date(loan.start_date);
      const loanEndDate = new Date(loan.end_date);
      return (
        loanStartDate.getFullYear() <= currentYear &&
        loanEndDate.getFullYear() >= currentYear
      );
    });

    const numberOfLoansInCurrentYear = currentYearLoans.length;
    const scorePerLoan = 5;

    const creditScore = numberOfLoansInCurrentYear * scorePerLoan;

    return Math.min(100, creditScore);
  } catch (error) {
    throw new Error(
      "Error calculating credit score for loan activity in the current year: " +
        error.message
    );
  }
}

function calculateCreditScoreForLoanApprovedVolume(customerData, currentLoans) {
  try {
    const approvedLimit = customerData.approved_limit;
    const totalLoanAmount = currentLoans.reduce(
      (sum, loan) => sum + loan.loan_amount,
      0
    );

    if (totalLoanAmount > approvedLimit) {
      return 0;
    }

    const usedLimitProportion = totalLoanAmount / approvedLimit;
    const scoringFactor = 200;

    const creditScore = Math.max(0, 100 - usedLimitProportion * scoringFactor);

    return creditScore;
  } catch (error) {
    throw new Error(
      "Error calculating credit score for loan approved volume: " +
        error.message
    );
  }
}

function approveLoan(request) {
  try {
    const {
      customer_id,
      loan_amount,
      interest_rate,
      tenure,
      credit_score,
      current_emis,
      monthly_salary,
    } = request;
    let corrected_interest_rate = interest_rate;
    let approval = true;

    if (credit_score > 50) {
      if (interest_rate < 10) {
        corrected_interest_rate = 10;
      }
    } else if (credit_score > 30) {
      if (interest_rate < 12) {
        corrected_interest_rate = 12;
      }
    } else if (credit_score > 10) {
      if (interest_rate < 16) {
        corrected_interest_rate = 16;
      } else {
        approval = false;
      }
    } else {
      approval = false;
    }

    if (current_emis.reduce((a, b) => a + b, 0) > 0.5 * monthly_salary) {
      approval = false;
    }

    const finalAmount = calculateFinalAmount(
      loan_amount,
      corrected_interest_rate,
      tenure
    );
    const monthly_installment_calculated = Number(
      (finalAmount / tenure).toFixed(2)
    );

    return {
      customer_id: customer_id,
      approval: approval,
      interest_rate: interest_rate,
      corrected_interest_rate: corrected_interest_rate,
      tenure: tenure,
      monthly_installment: monthly_installment_calculated,
    };
  } catch (error) {
    throw new Error("Error approving loan: " + error.message);
  }
}

function calculateStartAndEndDate(tenureInMonths) {
  try {
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    const endDate = new Date(
      startDate.setMonth(startDate.getMonth() + tenureInMonths)
    );

    const isoStartDate = startDate.toISOString().split("T")[0];
    const isoEndDate = endDate.toISOString().split("T")[0];

    return { startDate: isoStartDate, endDate: isoEndDate };
  } catch (error) {
    throw new Error("Error calculating start and end date: " + error.message);
  }
}

function calculateFinalAmount(loan_amount, interest_rate, tenure) {
  try {
    interest_rate = interest_rate / 100;
    const n = 12;
    const t = tenure / 12;

    const A = loan_amount * Math.pow(1 + interest_rate / n, n * t);

    return A;
  } catch (error) {
    throw new Error("Error calculating final amount: " + error.message);
  }
}

module.exports = {
  calculatePastLoansPaidOnTimeScore,
  approveLoan,
  calculateCreditScoreForLoanApprovedVolume,
  calculateCreditScoreForLoanActivityInCurrentYear,
  calculateNumberOfLoansTaken,
  calculateStartAndEndDate,
  calculateFinalAmount,
};
