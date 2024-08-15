const { default: axios } = require("axios");
const Crypto = require("../models/crypto.model.js");
const TaskModel = require("../models/task.model.js")
const fs = require('fs');

exports.getTasks = async (req, res) => {
  const userTelegramId = req.params.id;
  const taskResult = await TaskModel.getTaskByTelegramId(userTelegramId);
  res.send({
    message: taskResult.result,
    success: !taskResult.error
  })
}

exports.getAll = async (req, res) => {
  const userTelegramId = req.params.id;
  const taskResult = await TaskModel.getTasks();
  res.send({
    message: taskResult.res,
    success: taskResult.error ? false : true
  })
}

/**
 * 
 * @param {id, task_id, type, link} req 
 * @param {message, success} res 
 */
exports.createTaskStatus = async (req, res) => {
  const userTelegramId = req.body.id;
  const taskType = req.body.type;
  switch (taskType) {
    case 1:
      const urlObj = new URL(req.body.link);
      const chatId = urlObj.pathname.slice(1);
            //check join status
            const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_KEY}/getChatMember?chat_id=@${chatId}&user_id=${userTelegramId}`;
            try {
              const response = await axios.get(url);
              const responseData = response.data;
              if (responseData.ok) {
                const status = responseData.result.status;
                if (status === 'member' || status === 'administrator' || status === 'creator') {
                    const taskResult =await TaskModel.createStatus({user_id: userTelegramId, task_id: req.body.task_id});
                    res.send({
                      message: taskResult.result,
                      success: taskResult.error
                    })
                } else {
                  res.send({
                    message: `User ${userTelegramId} is not a member of the chat ${chatId}.`,
                    success: false
                  })
                }
              } else {
                res.send({
                  message: `server error`,
                  success: false
                })
              }
            } catch (error) {
              res.send({
                message: `error fetching chat member info: ${error.response.data.description}`,
                success: false
              })
            }
      
      break;
    case 2:
      const taskResult =await TaskModel.createStatus({user_id: userTelegramId, task_id: req.body.task_id});
      res.send({
        message: taskResult.result,
        success: taskResult.error
      })
      break;
  
    default:
      break;
  }
  // Crypto.updateTHSpeed(userTelegramId, taskResult.getRes[0].bonus, (error, result) => {
  //   res.send({
  //     message: result.error || result.res,
  //     success: error ? false : true
  //   })
  
  // })
}

/**
 * 
 * @param {name, bonus, image_url} req 
 * @param {message, success} res 
 */

exports.createTask = async (req, res) => {
  //save db
  const taskResult = await TaskModel.create({name: req.body.name, bonus: req.body.bonus, image_url: req.file.filename, link: req.body.link, type: req.body.type})
  res.send({
    message: taskResult.error || taskResult.res,
    success: taskResult.error ? false : true
  })
}


/**
 * 
 * @param {id} req 
 * @param {message, success} res 
 */

exports.delete = async (req, res) => {
  
  const taskResult = await TaskModel.delete(req.params.id)
  console.log(taskResult)
  res.send({
    message: taskResult.error || taskResult.res,
    success: taskResult.error ? false : true
  })
}
