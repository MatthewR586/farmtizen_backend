const pool = require("./db.js");
const bcrypt = require("bcrypt");
const BN = require("bn.js");

// Constructor
const User = function (user) {
  this.telegram_id = user.id;
  this.name = user.name;
  this.referral_id = user.referral_id;
};

User.register = async (newUser, result) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if the user already exists
    const [existingUser] = await connection.query("SELECT * FROM tbl_admin WHERE email = ?", [newUser.email]);

    if (existingUser.length) {
      // User already exists
      result({ kind: "user_exists" }, null);
      return;
    }

    // Hash the password before saving
    const hash = await bcrypt.hash(newUser.password, 10);
    newUser.password = hash;

    // Save the new user
    const [insertRes] = await connection.query("INSERT INTO tbl_admin SET ?", newUser);

    console.log("created user: ", { id: insertRes.insertId, ...newUser });
    result(null, { id: insertRes.insertId, ...newUser });

  } catch (err) {
    console.log("error: ", err);
    result(err, null);
  } finally {
    if (connection) connection.release();
  }
};


// Login method
User.login = async (email, password, result) => {
  let connection;

  try {
    connection = await pool.getConnection();

    // Find the user by email
    const [res] = await connection.query("SELECT * FROM tbl_admin WHERE email = ?", [email]);

    if (res.length) {
      const user = res[0];

      // Compare the provided password with the stored hashed password
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        console.log("login successful: ", user);
        result(null, user);
      } else {
        // Passwords don't match
        result({ kind: "invalid_password" }, null);
      }
    } else {
      // User not found
      result({ kind: "not_found" }, null);
    }
  } catch (err) {
    console.log("error: ", err);
    result(err, null);
  } finally {
    if (connection) connection.release();
  }
};




// Login method
User.auth = async (user, referral_id) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const loginQuery = `SELECT
                          u.*,
                          (SELECT COUNT(*) FROM tbl_user WHERE referral_id = ?) AS referral_counts,
                          l.level,
                          l.unlock_count
                        FROM
                            tbl_user u
                        JOIN
                            tbl_level l ON u.xp >= l.xp
                        WHERE
                            u.telegram_id = ?
                        ORDER BY
                            l.xp DESC
                        LIMIT 1;
                          `;
    const [res] = await connection.query(loginQuery, [user.id, user.id]);

    if (res.length) {
      return { error: null, result: { ...res[0], exist: true } };
    } else {
      const newUser = new User({ ...user, referral_id });

      const insertQuery = "INSERT INTO tbl_user SET ?";
      const [insertRes] = await connection.query(insertQuery, newUser);

      const [newUserRes] = await connection.query(loginQuery, [insertRes.insertId, insertRes.insertId]);
      return { error: null, result: { ...newUserRes[0], exist: false } };
    }
  } catch (err) {
    return { error: err, result: null };
  } finally {
    if (connection) connection.release();
  }
};

// Find user by ID
User.findById = async (id, result) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const query = "SELECT * FROM tbl_user WHERE id = ?";
    const [res] = await connection.query(query, [id]);

    if (res.length) {
      result(null, res[0]);
    } else {
      result({ kind: "not_found" }, null);
    }
  } catch (err) {
    result(err, null);
  } finally {
    if (connection) connection.release();
  }
};

// Get all users
User.getAll = async (name, result) => {
  let connection;

  try {
    connection = await pool.getConnection();
    let query = `
          SELECT 
              u.first_name, 
              u.last_name, 
              u.username,
              u.th_speed,
              (SELECT COUNT(*) FROM tbl_user WHERE referral_id = u.telegram_id) AS referral_counts,
              COALESCE(SUM(CASE WHEN th.token_type = 0 THEN th.amount END), 0) AS trx_deposit_amount,
              COALESCE(SUM(CASE WHEN th.token_type = 1 THEN th.amount END), 0) AS bnb_deposit_amount
          FROM 
              tbl_user u
          LEFT JOIN 
              tbl_transaction_history th ON u.telegram_id = th.user_id
          GROUP BY 
              u.id, u.first_name, u.last_name, u.username, u.th_speed
      `;

    if (name) {
      query += " WHERE name LIKE ?";
      name = `%${name}%`;
    }

    const [res] = await connection.query(query, [name]);
    result(null, res);
  } catch (err) {
    result(err, null);
  } finally {
    if (connection) connection.release();
  }
};

// Update user by ID
User.updateById = async (id, user, result) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const query = "UPDATE tbl_user SET name = ?, email = ? WHERE id = ?";
    const [res] = await connection.query(query, [user.name, user.email, id]);

    if (res.affectedRows == 0) {
      result({ kind: "not_found" }, null);
    } else {
      result(null, { id: id, ...user });
    }
  } catch (err) {
    result(err, null);
  } finally {
    if (connection) connection.release();
  }
};

// Remove user by ID
User.remove = async (id, result) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const query = "DELETE FROM tbl_user WHERE id = ?";
    const [res] = await connection.query(query, [id]);

    if (res.affectedRows == 0) {
      result({ kind: "not_found" }, null);
    } else {
      result(null, res);
    }
  } catch (err) {
    result(err, null);
  } finally {
    if (connection) connection.release();
  }
};

// Remove all users
User.removeAll = async (result) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const query = "DELETE FROM tbl_user";
    const [res] = await connection.query(query);

    result(null, res);
  } catch (err) {
    result(err, null);
  } finally {
    if (connection) connection.release();
  }
};

User.getTotalReferral = async (telegram_id) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const query = `select count(*) as total_referral from tbl_user where referral_id = ?`;
    const [res] = await connection.query(query, [telegram_id]);
    return { result: res[0], error: null }
  } catch (error) {
    return { result: null, error }
  }

}

User.updateTrxById = async (userTelegramId, approvedTrx) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const getQuery = `SELECT trx FROM tbl_user WHERE telegram_id = ?`;
    const [res] = await connection.query(getQuery, [userTelegramId]);
    console.log("---------------------", res.length)
    if (res.length > 0) {
      const query = `UPDATE tbl_user SET trx = ? WHERE telegram_id = ?`;
      const updatedTrx = new BN(res[0].trx).sub(new BN(approvedTrx)).toString();
      console.log("---------------------", updatedTrx)
      const [updateRes] = await connection.query(query, [
        updatedTrx,
        userTelegramId,
      ]);
      return { error: null, res: updateRes };
    } else {
      return { error: new Error("User not found"), res: null };
    }
  } catch (err) {
    return { error: err, res: null };
  } finally {
    if (connection) connection.release();
  }
};

User.updateBnbById = async (userTelegramId, approvedBnb) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const getQuery = `SELECT bnb FROM tbl_user WHERE telegram_id = ?`;
    const [res] = await connection.query(getQuery, [userTelegramId]);

    if (res.length > 0) {
      const query = `UPDATE tbl_user SET bnb = ? WHERE telegram_id = ?`;
      const updatedBnb = new BN(res[0].bnb).sub(new BN(approvedBnb)).toString();
      const [updateRes] = await connection.query(query, [
        updatedBnb,
        userTelegramId,
      ]);
      return { error: null, res: updateRes };
    } else {
      return { error: new Error("User not found"), res: null };
    }
  } catch (err) {
    return { error: err, res: null };
  } finally {
    if (connection) connection.release();
  }
};

User.updateAdminData = async (data, result) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const query = `UPDATE tbl_admin SET trx_address = ?, bnb_address = ?, trx_withdraw_amount = ?, bnb_withdraw_amount = ? WHERE id = ?`;
    const [updateRes] = await connection.query(query, [
      data.trx_address, data.bnb_address, data.trx_withdraw_amount, data.bnb_withdraw_amount, data.id
    ]);
    result(null, updateRes);
  } catch (err) {
    result(err, null);
  } finally {
    if (connection) connection.release();
  }
};

// Find user by ID
User.findAdminDataById = async (id, result) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const query = "SELECT * FROM tbl_admin WHERE id = ?";
    const [res] = await connection.query(query, [id]);

    if (res.length) {
      result(null, res[0]);
    } else {
      result({ kind: "not_found" }, null);
    }
  } catch (err) {
    result(err, null);
  } finally {
    if (connection) connection.release();
  }
};


// Purchase Plant
User.purchasePlant = async (userTelegramId, plantId, landPosition) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const isAmountValidQuery = `SELECT 
                                  u.telegram_id AS user_id,
                                  u.token_amount - p.price AS difference
                                FROM 
                                  tbl_user u
                                JOIN 
                                  tbl_plant p ON p.id = ?
                                WHERE 
                                  u.telegram_id = ?`;
    const isLandValidateQuery = `SELECT 
                                      COUNT(*) AS total_land, 
                                      plant_details.user_id
                                  FROM 
                                      tbl_plant_list 
                                  LEFT JOIN 
                                      (SELECT * 
                                      FROM tbl_plant_list 
                                      WHERE user_id = ? 
                                      AND land_position = ? 
                                      AND is_harvested = 0) AS plant_details 
                                  ON 
                                      tbl_plant_list.user_id = plant_details.user_id 
                                  WHERE 
                                      tbl_plant_list.user_id = ? 
                                      AND tbl_plant_list.is_harvested = 0;`
    const [isAmountValidResult] = await connection.query(isAmountValidQuery, [plantId, userTelegramId]);
    const [isLandValidateResult] = await connection.query(isLandValidateQuery, [userTelegramId, landPosition, userTelegramId]);

    if (isAmountValidResult[0]?.difference < 0) {
      return { error: true, result: "Token amount is not sufficient" }
    }
    if (isLandValidateResult[0].total_land > 19 || isLandValidateResult[0].user_id != null) {
      return { error: true, result: "Already planted" }
    }

    const updateQuery = `UPDATE tbl_user SET token_amount = ? WHERE telegram_id = ?`
    const [updateResult] = await connection.query(updateQuery, [isAmountValidResult[0].difference, userTelegramId])
    return { error: null, result: updateResult }
  } catch (err) {
    return { error: err, result: null }
  } finally {
    if (connection) connection.release();
  }
}

//increase token amount
User.increaseToken = async (telegramId, landPosition) => {
  let connection;

  try {
    connection = await pool.getConnection();

    const getPlantEarningQuery = `SELECT 
                                      p.earn 
                                  FROM 
                                      tbl_plant_list pl
                                  JOIN 
                                      tbl_plant p ON pl.plant_id = p.id
                                  WHERE 
                                      pl.user_id = ? 
                                      AND pl.land_position = ?;`;

    const [getPlantEarningResult] = await connection.query(getPlantEarningQuery, [telegramId, landPosition]);
    
    if (getPlantEarningResult.length) {
      const query = "update tbl_user set token_amount = token_amount + ? where telegram_id = ?";
      const [res] = await connection.query(query, [getPlantEarningResult[0].earn, telegramId]);
      if (res.affectedRows) {
        return { error: false, result: "Harvested successfully" };
      } else {
        return { result: 'user not found', error: true };
      }
    } else {
      return { result: 'Plant not found', error: true };
    }
  } catch (err) {
    console.log(err)
    return { error: true, result: 'Sever error' };
  } finally {
    if (connection) connection.release();
  }
}

//get friends count
User.getFriendCount = async (telegramId) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const query = "select count(*) as total_count from tbl_user where referral_id = ?";
    const [res] = await connection.query(query, [telegramId]);

    if (res.length) {
      return { error: false, result: res[0] };
    } else {
      return { error: "not_found", result: null };
    }
  } catch (err) {
    return { error: true, result: "server error" };
  } finally {
    if (connection) connection.release();
  }
}


//get friends count
User.isLastStealDateValid = async (telegramId) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const query = "select count(*) as count from tbl_user WHERE last_steal_date < UTC_DATE() and telegram_id = ?";
    const [res] = await connection.query(query, [telegramId]);

    if (res.length) {
      return { error: false, result: res[0] };
    } else {
      return { error: "not_found", result: null };
    }
  } catch (err) {
    return { error: true, result: "server error" };
  } finally {
    if (connection) connection.release();
  }
}

//steal friend (update token_amount, last_steal_date)
User.stealFriend = async (telegramId, stealAmount) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const query = "UPDATE tbl_user SET token_amount = token_amount + ?, last_steal_date = UTC_TIMESTAMP()  WHERE telegram_id = ?";

    const [res] = await connection.query(query, [stealAmount, telegramId]);

    if (res) {
      return { error: false, result: res };
    } else {
      return { error: true, result: 'not found' };
    }
  } catch (err) {
    return { error: true, result: "server error" };
  } finally {
    if (connection) connection.release();
  }
}


// upgrade level up token
User.upgradeLevelUpToken = async (telegramId, levelUpAmount) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const query = `UPDATE tbl_user 
                    SET token_amount = token_amount - ?,  level_up_token = level_up_token + ?
                    WHERE telegram_id = ? 
                    AND token_amount - ? > 0;`;

    const [res] = await connection.query(query, [levelUpAmount, levelUpAmount, telegramId, levelUpAmount]);
    if (res.changedRows == 0) {
      return { error: false, result: "Amount is not valid" }
    }

    if (res) {
      return { error: false, result: res };
    } else {
      return { error: true, result: 'not found' };
    }
  } catch (err) {
    return { error: true, result: "server error" };
  } finally {
    if (connection) connection.release();
  }
}

// upgrade level up token
User.getCurrentLevel = async (telegramId) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const query = `SELECT
                      u.id AS user_id,
                      u.name,
                      u.xp,
                      l.level,
                      l.unlock_count
                  FROM
                      tbl_user u
                  JOIN
                      tbl_level l ON u.xp >= l.xp
                  WHERE
                      u.id = ? -- Replace ? with the specific user ID
                  ORDER BY
                      l.xp DESC
                  LIMIT 1;`;

    const [res] = await connection.query(query, [telegramId]);
    if (res.changedRows == 0) {
      return { error: false, result: "Amount is not valid" }
    }

    if (res) {
      return { error: false, result: res };
    } else {
      return { error: true, result: 'not found' };
    }
  } catch (err) {
    return { error: true, result: "server error" };
  } finally {
    if (connection) connection.release();
  }
}

// upgrade level up token
User.updateAmountOrXP = async (telegramId, amount, bonus_type) => {
  let connection;

  try {
    connection = await pool.getConnection();
    let updateQuery;
    if(bonus_type == 0) {
      updateQuery = `UPDATE tbl_user SET token_amount = token_amount + ? WHERE telegram_id = ?`
    } else {
      updateQuery = `UPDATE tbl_user SET xp = xp + ? WHERE telegram_id = ?`
    }
    const [updateResult] = await connection.query(updateQuery, [amount, telegramId])  

    if (updateResult.changedRows == 0) {
      return { error: false, result: "Nothing to update" }
    }

    if (updateResult) {
      return { error: false, result: updateResult };
    } else {
      return { error: true, result: 'not found' };
    }
  } catch (err) {
    return { error: true, result: "server error" };
  } finally {
    if (connection) connection.release();
  }
}
module.exports = User;
