const Spin = require("../models/spin.model.js");

// Add New Spin
/**
 * 
 * @param {name, type, icon, bonus} req 
 * @param {message, success} res 
 */
exports.addnewSpin = async (req, res) => {
  const result = await Spin.addnewSpin({name: req.body.name, type: req.body.type, icon: req.body.icon, bonus: req.body.bonus});

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

// Get New Spin
/**
 * 
 * @param {} req 
 * @param {message, success} res 
 */
exports.getSpinList = async (req, res) => {
  const result = await Spin.getSpin();

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

// Get New Spin
/**
 * 
 * @param {id} req 
 * @param {message, success} res 
 */
exports.addNewSpinList = async (req, res) => {
  const result = await Spin.getSpin();

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