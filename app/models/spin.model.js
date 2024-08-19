const constant = require("../config/constant.js");
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

Spin.addNewSpinList = async (newSpinItem) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const updateTokenAmountQuery = `UPDATE tbl_user 
                    SET token_amount = token_amount - ?
                    WHERE telegram_id = ? 
                    AND token_amount - ? >= 0;`;
    const [updateTokenAmountResult] = await connection.query(updateTokenAmountQuery, [constant.SPIN_TOKEN_AMOUNT, newSpinItem.user_id, constant.SPIN_TOKEN_AMOUNT])
    console.log(updateTokenAmountResult)
    if (!updateTokenAmountResult.affectedRows) {
      return {result: 'Token amount is not sufficient', error: true}
    }
    const createNewSpinList = `INSERT INTO tbl_spin_list set ?`;

    // Insert the new spin into the database
    const [insertSpinResult] = await connection.query(createNewSpinList, [newSpinItem]);
    return { result: insertSpinResult, error: false };

  } catch (err) {
    return { result: err, error: true };
  } finally {
    if (connection) connection.release();
  }
}

module.exports = Spin;
