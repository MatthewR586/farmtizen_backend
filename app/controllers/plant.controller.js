const Plant = require("../models/plant.model.js");
const User = require("../models/user.model.js");
const constant = require("../config/constant.js");
// get user landed plant list 
exports.getUserPlantList = async (req, res) => {
  const userTelegramId = req.params.id;
  const result = await Plant.getUserPlantList(userTelegramId);
  if(result.error) {
    res.send({
      message: result.error,
      success: false
    })
  } else {
    res.send({
      message: result.result,
      success: true
    })
  }
}

// plant new crop
/**
 * 
 * @param {id, plantId, landPosition} req 
 * @param {message, success} res 
 */
exports.seedNewPlant = async (req, res) => {
  if(req.body.plantId == null || req.body.landPosition == null) {
    res.send({
      message: "some field is required",
      success: false
    })
    return;
  }

  const userTelegramId = req.body.id;
  const newPlantList = {
    user_id: userTelegramId,
    plant_id: req.body.plantId,
    land_position: req.body.landPosition
  };

  const purchaseResult = await User.purchasePlant(userTelegramId, req.body.plantId, req.body.landPosition);

  if(purchaseResult.error) {
    res.send({
      message: purchaseResult.result,
      success: false
    })
  } else {
    const result = await Plant.seedNewPlant(newPlantList);
    if(result.error) {
      res.send({
        message: result.error,
        success: false
      })
    } else {
      res.send({
        message: result.result.affectedRows > 0 ? "Success" : "Error occurred",
        success: result.result.affectedRows > 0 ? true : false
      })
    }  
  }
}

// plant new crop
/**
 * 
 * @param {id, landPosition, plantId} req 
 * @param {message, success} res 
 */
exports.harvestPlant = async (req, res) => {
  const userTelegramId = req.body.id;
  const havestedPlant = {
    user_id: userTelegramId,
    land_position: req.body.landPosition
  };
  const result = await Plant.harvestPlant(havestedPlant);
  console.log(result)
  if(result.error) {
    res.send({
      message: result.error,
      success: false
    })
  } else {
    // increase token amount
    const increasedResult = User.increaseToken(userTelegramId, req.body.plantId);
    
    console.log(increasedResult)

    res.send({
      message: result.result,
      success: true
    })
  }
}

// Get All Plants
/**
 * 
 * @param {} req 
 * @param {message, success} res 
 */
exports.getAllPlant = async (req, res) => {
  const result = await Plant.getPlants();
  console.log(result)
  if(result.error) {
    res.send({
      message: result.error,
      success: false
    })
  } else {
    // // increase token amount
    // const increasedResult = User.increaseToken(userTelegramId, req.body.plantId);
    
    // console.log(increasedResult)

    res.send({
      message: result.result,
      success: true
    })
  }
}
