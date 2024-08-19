const Promotion = require("../models/promotion.model.js");
const Ticket = require("../models/ticket.model.js");
const { v4: uuidv4 } = require('uuid');

// Get Active Promotion
/**
 * 
 * @param {pageIndex} req 
 * @param {message, success} res 
 */
exports.getPromotion = async (req, res) => {
  const result = await Promotion.getPromotion(req.query.pageIndex);
  console.log(result)
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

// Get Purchased Promotion
/**
 * 
 * @param {id, pageIndex} req 
 * @param {message, success} res 
 */
exports.getTicket = async (req, res) => {
  const result = await Promotion.getPurchasedPromotion(req.query.id, req.query.pageIndex);
  console.log(result)
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

// Get Past Promotion
/**
 * 
 * @param {pageIndex} req 
 * @param {message, success} res 
 */
exports.getPastPromotion = async (req, res) => {
  const result = await Promotion.getPastPromotion(req.query.pageIndex || 1);
  console.log(result)
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

// Add New Promotion
/**
 * 
 * @param {title, description, expired_date, price, ticket_count} req 
 * @param {message, success} res 
 */
exports.addNewPromotion = async (req, res) => {
  const newPromotion = new Promotion({
    title: req.body.title,
    description: req.body.description,
    expired_date: req.body.expired_date,
    price: req.body.price,
    ticket_count: 3
  })
  const result = await Promotion.addNewPromotion(newPromotion);
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

// Buy new Ticket
/**
 * 
 * @param {id, promotion_id} req 
 * @param {message, success} res 
 */
exports.buyNewTicket = async (req, res) => {
  const newTicket = new Ticket({
    ticket_number: uuidv4(),
    user_id: req.body.id,
    promotion_id: req.body.promotion_id
  })
  const result = await Ticket.addNewTicket(newTicket);
  if(result.error) {
    res.send({
      message: result.result,
      success: false
    })
  } else {
  
    res.send({
      message: result.result,
      success: true
    })
  }
}

// Get promotion Detail
/**
 * 
 * @param {id, promotion_id} req 
 * @param {message, success} res 
 */
exports.getPromotionDetail = async (req, res) => {
  const result = await Promotion.getDetail(req.query.id, req.query.promotion_id);
  if(result.error) {
    res.send({
      message: result.result,
      success: false
    })
  } else {
  
    res.send({
      message: result.result,
      success: true
    })
  }
}

// Get Past Promotion
/**
 * 
 * @param {} req 
 * @param {message, success} res 
 */
exports.getAllPromotions = async (req, res) => {
  const result = await Promotion.getAllPromotions();
  console.log(result)
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