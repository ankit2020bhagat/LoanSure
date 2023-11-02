function calculatePastLoansPaidOnTimeScore(loanData) {
  const totalLoans = loanData.length;
  const loansPaidOnTime = loanData.filter(
    (loan) => loan.EMIs_paid_on_Time === loan.tenure
  ).length;

  if (totalLoans === 0) {
    // Avoid division by zero
    return 0;
  }

  // Calculate the percentage of loans paid on time
  const percentagePaidOnTime = (loansPaidOnTime / totalLoans) * 100;

  // Assign a score based on the percentage
  // You can adjust this scoring system as needed
  let score = 0;
  if (percentagePaidOnTime >= 80) {
    score = 20;
  } else if (percentagePaidOnTime >= 60) {
    score = 15;
  } else if (percentagePaidOnTime >= 40) {
    score = 10;
  }

  return score;
}

function calculateNumberOfLoansTaken(loanData, customerId) {
  //console.log(loanData[0]);
  const loansTaken = loanData.filter((loan) => loan.customer_id == customerId);
  return loansTaken.length;
}
function calculateCreditScoreForLoanActivityInCurrentYear(
  loanData,
  currentYear
) {
  // Filter loans that are active in the current year
  const currentYearLoans = loanData.filter((loan) => {
    const loanStartDate = new Date(loan.start_date);
    const loanEndDate = new Date(loan.end_date);
    return (
      loanStartDate.getFullYear() <= currentYear &&
      loanEndDate.getFullYear() >= currentYear
    );
  });

  // Calculate loan activity score based on the number of loans in the current year
  const numberOfLoansInCurrentYear = currentYearLoans.length;

  // Define a scoring system based on the number of loans
  const scorePerLoan = 5; // Adjust as needed

  // Calculate the credit score based on loan activity in the current year
  const creditScore = numberOfLoansInCurrentYear * scorePerLoan;

  // Ensure the credit score does not exceed the maximum (e.g., 100)
  return Math.min(100, creditScore);
}
function calculateCreditScoreForLoanApprovedVolume(customerData, currentLoans) {
  // console.log(customerData);
  const approvedLimit = customerData.approved_limit;
  //console.log(approvedLimit);
  // Calculate the total loan amount of current loans
  const totalconosole = currentLoans.reduce(
    (sum, loan) => sum + loan.loan_amount,
    0
  );
  if (totalconosole > approvedLimit) {
    // If the sum of current loans exceeds the approved limit, set credit score to 0
    return 0;
  }
  // Calculate the proportion of used limit to approved limit
  const usedLimitProportion = totalconosole / approvedLimit;

  // Define a scoring factor based on the proportion
  const scoringFactor = 200; // Adjust as needed

  // Calculate the credit score based on the proportion of used limit
  const creditScore = Math.max(0, 100 - usedLimitProportion * scoringFactor);

  return creditScore;
}
function approveLoan(request) {
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
    }
  } else {
    approval = false;
  }

  if (current_emis.reduce((a, b) => a + b, 0) > 0.5 * monthly_salary) {
    console.log("flgif");
    approval = false;
  }

  // const monthly_installment_calculated =
  //   (loan_amount * (corrected_interest_rate / 100)) /
  //   (1 - Math.pow(1 + corrected_interest_rate / 100, -tenure));
  const finalAmount = calculateFinalAmount(
    loan_amount,
    corrected_interest_rate,
    tenure
  );
  //console.log(finalAmount);
  const monthly_installment_calculated = Number(
    (finalAmount / tenure).toFixed(2)
  );
  console.log(monthly_installment_calculated);
  return {
    customer_id: customer_id,
    approval: approval,
    interest_rate: interest_rate,
    corrected_interest_rate: corrected_interest_rate,
    tenure: tenure,
    monthly_installment: monthly_installment_calculated,
  };
}
function calculateStartAndEndDate(tenureInMonths) {
  const currentDate = new Date(); // Get the current date
  const startDate = new Date(currentDate); // Create a copy of the current date

  // Calculate the end date by adding the tenure in months to the start date
  const endDate = new Date(
    startDate.setMonth(startDate.getMonth() + tenureInMonths)
  );

  // Convert the start and end dates to ISO format
  const isoStartDate = startDate.toISOString().split("T")[0]; // Extract YYYY-MM-DD
  const isoEndDate = endDate.toISOString().split("T")[0]; // Extract YYYY-MM-DD

  return { startDate: isoStartDate, endDate: isoEndDate };
}
function calculateFinalAmount(loan_amount, interest_rate, tenure) {
  // Extract loan data
  //let { loan_amount, interest_rate, tenure } = loanData;

  // Calculate the final amount (A)
  interest_rate = interest_rate / 100;
  const n = 12; // Assuming interest is compounded monthly (12 times a year)
  const t = tenure / 12; // Convert tenure to years

  const A = loan_amount * Math.pow(1 + interest_rate / n, n * t);

  return A;
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
