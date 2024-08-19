const Spin = require("../models/spin.model.js");
const User = require("../models/user.model.js");
const { updateAmountOrXP } = require("../models/user.model.js");

// Add New Spin
/**
 * 
 * @param {name, type, icon, bonus} req 
 * @param {message, success} res 
 */
exports.addnewSpin = async (req, res) => {
  const result = await Spin.addnewSpin({ name: req.body.name, type: req.body.type, icon: req.body.icon, bonus: req.body.bonus });

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

// Get New Spin
/**
 * 
 * @param {} req 
 * @param {message, success} res 
 */
exports.getSpinList = async (req, res) => {
  const result = await Spin.getSpin();

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

// Get New Spin
/**
 * 
 * @param {id} req 
 * @param {message, success} res 
 */
exports.addNewSpinList = async (req, res) => {
  const result = await Spin.getSpin();
  const randomSpin = result.result[Math.floor(Math.random() * result.result.length)]
  
  const addNewSpinResult = await Spin.addNewSpinList({user_id: req.body.id, spin_id: randomSpin.id});

  if (result.error) {
    res.send({
      message: result.result,
      success: false
    })
  } else {
    const randomSpin = result.result[Math.floor(Math.random() * result.result.length)]
      
    switch (randomSpin.type) {
      case 0: // game token
      case 1: // xp
        updateAmountOrXP(req.body.id, randomSpin.bonus, randomSpin.type)
        break;
      case 2: // plant
        User.addPlantToStore(req.body.id, randomSpin.bonus)
        break;
  
      default:
        break;
    }

    if (addNewSpinResult.error) {
      res.send({
        message: addNewSpinResult.result,
        success: false
      })  
    } else {

      res.send({
        message: randomSpin,
        success: true
      })
    }

  }
}