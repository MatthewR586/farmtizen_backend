const pool = require("./db.js");

// Constructor
const Spin = function (spin) {
  this.name = spin.name;
  this.type = spin.type;
  this.icon = spin.icon;
  this.bonus = spin.bonus;
};

Spin.addnewSpin = async (newSpinItem) => {
  let connection;
  try {
    const createNewSpinItem = `INSERT INTO tbl_spin set ?`;
    connection = await pool.getConnection();

    // Insert the new spin into the database
    const [insertSpinResult] = await connection.query(createNewSpinItem, [newSpinItem]);
    return { result: insertSpinResult, error: false };

  } catch (err) {
    return { result: err, error: true };
  } finally {
    if (connection) connection.release();
  }
}

Spin.getSpin = async () => {
  let connection;
  try {
    const getSpinItemsQuery = `select * from tbl_spin`;
    connection = await pool.getConnection();

    // Get the new spin into the database
    const [getSpinResult] = await connection.query(getSpinItemsQuery);
    return { result: getSpinResult, error: false };

  } catch (err) {
    return { result: err, error: true };
  } finally {
    if (connection) connection.release();
  }
}
module.exports = Spin;
