const Plant = require("../models/plant.model.js");
const User = require("../models/user.model.js");
const constant = require("../config/constant.js");
// get user landed plant list 
exports.getUserPlantList = async (req, res) => {
  const userTelegramId = req.params.id;
  const result = await Plant.getUserPlantList(userTelegramId);
  if (result.error) {
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
  if (req.body.plantId == null || req.body.landPosition == null) {
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

  // const purchaseResult = await User.purchasePlant(userTelegramId, req.body.plantId, req.body.landPosition);

  const result = await Plant.seedNewPlant(newPlantList);
    res.send({
      message: result.result,
      success: result.error
    })
}

// plant new crop
/**
 * 
 * @param {id, landPosition} req 
 * @param {message, success} res 
 */
exports.harvestPlant = async (req, res) => {
  const userTelegramId = req.body.id;
  const havestedPlant = {
    user_id: userTelegramId,
    land_position: req.body.landPosition
  };
  const result = await Plant.harvestPlant(havestedPlant);
  if (result.error) {
    res.send({
      message: result.error,
      success: false
    })
  } else {
    // increase token amount
    const increasedResult = await User.increaseToken(userTelegramId, req.body.landPosition);
    if (increasedResult.error) {
      res.send({
        message: increasedResult.result,
        success: false
      })
      return;
    }
    if (result.result.affectedRows == 0) {
      res.send({
        message: "Harvest time is not valid",
        success: false
      })
      return;
    }
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
  if (result.error) {
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

// plant new crop
/**
 * 
 * @param {id, plant_id} req 
 * @param {message, success} res 
 */
exports.purchaseNewPlant = async (req, res) => {
  const userTelegramId = req.body.id;
  const plantId = req.body.plant_id;
  const result = await User.purchasePlant(userTelegramId, plantId);
  if (result.error) {
    res.send({
      message: result.result,
      success: false
    })
  } else {
    res.send({
      message: "Added successfully",
      success: true
    })
  }
}

// get stored plant list
/**
 * 
 * @param {id} req 
 * @param {message, success} res 
 */
exports.getStorePlant = async (req, res) => {
  const userTelegramId = req.query.id;
  if (!userTelegramId) {
    res.send({
      message: 'User id is not valid',
      success: false
    })
    return
  }
  const result = await User.getStorePlant(userTelegramId);
    res.send({
      message: result.result,
      success: result.error
    })
}