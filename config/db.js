const mysql = require("mysql");
const xlsx = require("xlsx");
require("dotenv").config();
// Create a connection pool instead of a single connection
const dbPool = mysql.createPool({
  connectionLimit: 10, // Adjust the number of connections as needed
  host: "localhost",
  user: "root",
  password: process.env.PASSWORD,
  database: "customer",
});
let flag = true;
// Wrap the database connection in a function to ensure it is established before data ingestion
const connectDatabase = () => {
  return new Promise((resolve, reject) => {
    dbPool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        console.log("Database Connected!");
        resolve(connection);
      }
    });
  });
};

const closeDatabase = (connection) => {
  return new Promise((resolve, reject) => {
    connection.release();
    resolve();
  });
};

const ingestCustomerData = async () => {
  let connection;
  try {
    connection = await connectDatabase();

    const customerDataFile = xlsx.readFile("customer_data.xlsx");
    const worksheet = customerDataFile.Sheets[customerDataFile.SheetNames[0]];
    const customerData = xlsx.utils.sheet_to_json(worksheet);

    for (const row of customerData) {
      await connection.query(
        "INSERT INTO customer_data (first_name, last_name,age, phone_number, monthly_salary, approved_limit) VALUES (?, ?, ?, ?, ?,?)",
        [
          row.first_name,
          row.last_name,
          row.age,
          row.phone_number,
          row.monthly_salary,
          row.approved_limit,
        ]
      );
    }
  } catch (error) {
    console.error("Error ingesting customer data:", error);
  } finally {
    if (connection) {
      await closeDatabase(connection);
    }
  }
};

const ingestLoanData = async () => {
  let connection;
  try {
    connection = await connectDatabase(); // Assuming connectDatabase and closeDatabase functions are defined

    const loanDataFile = xlsx.readFile("loan_data.xlsx");
    const worksheet = loanDataFile.Sheets[loanDataFile.SheetNames[0]];
    const loanData = xlsx.utils.sheet_to_json(worksheet);

    for (const row of loanData) {
      //console.log(row);
      const startDateExcelSerial = row.start_date;
      const endDateExcelSerial = row.end_date;

      const startDate = new Date((startDateExcelSerial - 25569) * 86400 * 1000);
      const endDate = new Date((endDateExcelSerial - 25569) * 86400 * 1000);

      // Format the dates in ISO date format
      const startDateISO = startDate.toISOString().split("T")[0]; // Format as "YYYY-MM-DD"
      const endDateISO = endDate.toISOString().split("T")[0];

      try {
        dbPool.query(
          "INSERT INTO loan_data (customer_id, loan_amount, tenure, interest_rate, monthly_payment, EMIs_paid_on_Time, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            row.customer_id,
            row.loan_amount,
            row.tenure,
            row.interest_rate,
            row.monthly_payment,
            row.EMIs_paid_on_Time,
            startDateISO,
            endDateISO,
          ],
          function (error, results, fields) {
            if (error) {
              console.log(error);
            }
          }
        );
      } catch (err) {
        console.log(err);
      }
    }
  } catch (error) {
    console.error("Error ingesting loan data:", error);
  } finally {
    if (connection) {
      await closeDatabase(connection);
    }
  }
};
// ingestCustomerData();
// ingestLoanData();
module.exports = dbPool;
