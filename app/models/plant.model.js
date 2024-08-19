const pool = require("./db.js");
const bcrypt = require("bcrypt");
const BN = require("bn.js");

// Constructor
const Plant = function (plant) {
  this.name = plant.name;
  this.seed_logo = plant.seed_logo;
  this.grow_logo = plant.grow_logo;
  this.harvest_logo = plant.harvest_logo;
  this.harvest_time = plant.harvest_time;
  this.price = plant.price;
};

Plant.register = async (newUser, result) => {
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

Plant.create = async (newPlant) => {
  let connection;
  try {
    const createQuery = "INSERT INTO tbl_plant SET ?";

    connection = await pool.getConnection();

    // Insert the new plant into the database
    const [createResult] = await connection.query(createQuery, [newPlant]);
    return { result: createResult, error: null };

  } catch (err) {
    return { result: null, error: err };
  } finally {
    if (connection) connection.release();
  }
}

Plant.getUserPlantList = async (userTelegramId) => {
  let connection;
  try {
    const createQuery = "select * from tbl_plant_list left join tbl_plant on tbl_plant.id = tbl_plant_list.plant_id where tbl_plant_list.is_harvested = 0 and tbl_plant_list.user_id = ?";

    connection = await pool.getConnection();

    // Insert the new plant into the database
    const [createResult] = await connection.query(createQuery, [userTelegramId]);
    console.log(createResult)
    return { result: createResult, error: null };
  } catch (err) {
    console.log(err)
    return { result: null, error: err };
  } finally {
    if (connection) connection.release();
  }
}


Plant.seedNewPlant = async (newPlantList) => {

  let connection;
  try {
    connection = await pool.getConnection();

    const stockQuantityQuery = `select count from tbl_store where user_id = ? and plant_id = ?`
    const [stockQuantityResult] = await connection.query(stockQuantityQuery, [newPlantList.user_id, newPlantList.plant_id])
    console.log(stockQuantityResult[0]?.count)
    if(stockQuantityResult[0]?.count == undefined || stockQuantityResult[0]?.count == 0) {
      return {result: `You don't have enough stock`, error: true}
    }

    const createQuery = `INSERT INTO tbl_plant_list (user_id, plant_id, land_position, land_started_time)
                          SELECT ?, ?, ?, ?
                          WHERE (SELECT COUNT(*) 
                                FROM tbl_plant_list 
                                WHERE user_id = ? AND is_harvested = 0) < 20
                          AND NOT EXISTS (
                            SELECT 1 
                            FROM tbl_plant_list 
                            WHERE user_id = ? AND land_position = ? AND is_harvested = 0
                              );`;


    // Insert the new plant into the database
    const [createResult] = await connection.query(createQuery, [newPlantList.user_id, newPlantList.plant_id, newPlantList.land_position, new Date().toISOString(), newPlantList.user_id, newPlantList.user_id, newPlantList.land_position]);
    if(createResult.affectedRows == 0) {
      return { result: "Already planted", error: true };
    }

    const updateInventoryQuery = `UPDATE tbl_store SET count = count - 1 WHERE user_id = ? AND plant_id = ?`
    const [updateInventoryResult] = await connection.query(updateInventoryQuery, [newPlantList.user_id, newPlantList.plant_id]);
    if(updateInventoryResult.affectedRows == 0) {
      return { result: "Update failed", error: true };
    }
    
    return { result: "Planted Successfully", error: false };

  } catch (err) {
    console.log(err)
    return { result: null, error: err };
  } finally {
    if (connection) connection.release();
  }
}

Plant.harvestPlant = async (harvestedPlant) => {
  let connection;
  try {
    const harvestQuery = `UPDATE tbl_plant_list tpl
                          JOIN tbl_plant tp ON tpl.plant_id = tp.id 
                          SET tpl.is_harvested = 1 
                          WHERE
                            tpl.user_id = ? 
                            AND tpl.land_position = ?
                            AND tpl.is_harvested = 0 
                            AND TIMESTAMPDIFF( SECOND, tpl.land_started_time, UTC_TIMESTAMP( ) ) > tp.harvest_time;`;
    connection = await pool.getConnection();

    // Insert the new plant into the database
    const [harvestResult] = await connection.query(harvestQuery, [harvestedPlant.user_id, harvestedPlant.land_position]);
    return { result: harvestResult, error: null };

  } catch (err) {
    return { result: null, error: err };
  } finally {
    if (connection) connection.release();
  }
}


Plant.getPlants = async () => {
  let connection;
  try {
    const getPlantQuery = `select * from tbl_plant`;
    connection = await pool.getConnection();

    // Insert the new plant into the database
    const [getPlantResult] = await connection.query(getPlantQuery);
    return { result: getPlantResult, error: null };

  } catch (err) {
    return { result: null, error: err };
  } finally {
    if (connection) connection.release();
  }
}


module.exports = Plant;
