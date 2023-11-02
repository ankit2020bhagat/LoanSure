const dbPool = require("../config/db");

exports.findAll = (req, res) => {
  dbPool.query("SELECT * FROM loan_data", function (error, results, fields) {
    if (error) {
      console.log(error); // Log the error for debugging
      return res
        .status(500)
        .json({ error: "An error occurred while retrieving data" });
    }

    res.json(results);
  });
};

exports.register = async (req, res) => {
  const { first_name, last_name, age, monthly_income, phone_number } = req.body;

  if (!first_name || !last_name || !age || !monthly_income || !phone_number) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Calculate the approved limit based on the salary
  const approved_limit = Math.round((36 * monthly_income) / 100000) * 100000; // Rounded to the nearest lakh

  try {
    dbPool.getConnection((err, connection) => {
      if (err) {
        console.error("Error acquiring a database connection:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      const sql =
        "INSERT INTO customer_data (first_name, last_name, phone_number, monthly_salary, approved_limit) VALUES (?, ?, ?, ?, ?)";
      const values = [
        first_name,
        last_name,
        phone_number,
        monthly_income,
        approved_limit,
      ];

      connection.query(sql, values, (error, results) => {
        connection.release();

        if (error) {
          console.error("Error inserting customer data:", error);
          return res
            .status(500)
            .json({ error: "An error occurred while adding the customer" });
        }

        return res.status(201).json({
          message: "Customer added successfully",
          customer_id: results.insertId,
          name: first_name + " " + last_name,
          age: age,
          monthly_income: monthly_income,
          approved_limit: approved_limit,
          phone_number: phone_number,
        });
      });
    });
  } catch (error) {
    console.error("Error processing registration:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
