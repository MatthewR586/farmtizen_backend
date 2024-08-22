const User = require("../models/user.model.js");
const TonWeb = require('tonweb');
const CryptoModel = require("../models/crypto.model.js")
const TransactionModel = require("../models/transaction.model.js")
const BN = require("bn.js");
const constant = require("../config/constant.js");
const { generateRandomAmount } = require("../utility/index.js");
const tonweb = new TonWeb();
// Register a new user
exports.register = (req, res) => {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  // Create a User
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  // Save User in the database
  User.register(user, (err, data) => {
    if (err) {
      if (err.kind === "user_exists") {
        res.send({
          message: "User already exists with this email.",
          success: false,
        });
      } else {
        res.send({
          message:
            err.message || "Some error occurred while registering the user.",
          success: false,
        });
      }
    } else {
      res.send({ message: data, success: true });
    }
  });
};

// User login
exports.login = (req, res) => {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }

  // Find the user and compare password
  User.login(req.body.email, req.body.password, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(200).send({
          message: `User not found with email ${req.body.email}.`,
          success: false,
        });
      } else if (err.kind === "invalid_password") {
        res.status(200).send({
          message: "Invalid password.",
          success: false,
        });
      } else {
        res.status(200).send({
          message: "Error logging in with email " + req.body.email,
          success: false,
        });
      }
    } else {
      res.send({
        message: data,
        success: true,
      });
    }
  });
};

// Create and Save a new User (alternative method to register)
exports.create = (req, res) => {
  // Validate request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
  }

  // Create a User
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  // Save User in the database
  User.create(user, (err, data) => {
    if (err)
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    else res.send(data);
  });
};

// Retrieve all Users from the database (with condition).
exports.findAll = (req, res) => {
  const name = req.query.name;

  User.getAll(name, (err, data) => {
    if (err)
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
        success: false
      });
    else res.send({message: data, success: true});
  });
};

// Find a single User by Id
exports.findOne = (req, res) => {
  User.findById(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found User with id ${req.params.id}.`,
        });
      } else {
        res.status(500).send({
          message: "Error retrieving User with id " + req.params.id,
        });
      }
    } else res.send(data);
  });
};

// Update a User identified by the id in the request
exports.update = (req, res) => {
  // Validate Request
  if (!req.body) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
  }

  User.updateById(req.params.id, new User(req.body), (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found User with id ${req.params.id}.`,
        });
      } else {
        res.status(500).send({
          message: "Error updating User with id " + req.params.id,
        });
      }
    } else res.send(data);
  });
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  User.remove(req.params.id, (err, data) => {
    if (err) {
      if (err.kind === "not_found") {
        res.status(404).send({
          message: `Not found User with id ${req.params.id}.`,
        });
      } else {
        res.status(500).send({
          message: "Could not delete User with id " + req.params.id,
        });
      }
    } else res.send({ message: `User was deleted successfully!` });
  });
};

// Delete all Users from the database.
exports.deleteAll = (req, res) => {
  User.removeAll((err, data) => {
    if (err)
      res.status(500).send({
        message: err.message || "Some error occurred while removing all users.",
      });
    else res.send({ message: `All Users were deleted successfully!` });
  });
};

// User login
exports.auth = async (req, res) => {
  if (!req.body.user) {
    res.send({
      message: "Content can not be empty!",
      success: false
    });
    return;
  }
 
  const result = await User.auth({...req.body.user}, req.query.start);
  if(result.error) {
    res.send({
      message: "bad request",
      success:  false
    })  
  } else {
    res.send({
      message: result.result,
      success:  true 
    })
  }

};

// get current users friend count
exports.getFriendCount = async (req, res) => {
  if (!req.query.id) {
    res.send({
      message: "telegram id is empty!",
      success: false
    });
    return;
  }
 
  const result = await User.getFriendCount(req.query.id);
  
  if(result.error) {
    res.send({
      message: "bad request",
      success:  false
    })  
  } else {
    res.send({
      message: {...result.result, token_per_referral: 100},
      success:  true 
    })
  }
};

// steal friend's token
exports.stealFriend = async (req, res) => {
  try {
    if (!req.body.id) {
      res.send({
        message: "telegram id is empty!",
        success: false
      });
      return;
    }
   
    const result = await User.getFriendCount(req.body.id);
    
    if(result.error) {
      res.send({
        message: "request failed",
        success:  false
      })  
    } else {
      if(result.total_count == 0) {
        res.send({
          message: "You don't have any friends",
          success:  false
        })
      } else {
        const isLastStealDateValid = await User.isLastStealDateValid(req.body.id);
        if(isLastStealDateValid.error) {
          res.send({
            message: "request failed",
            success:  false    
          })
        } else {
          if(isLastStealDateValid.result.count) {
            const stealAmount = generateRandomAmount(0,1000);
            const stealResult = await User.stealFriend(req.body.id, stealAmount)
            if(stealResult.error) {
              res.send({
                message: stealResult.result,
                success:  false
              })   
            } else {
              res.send({
                message: stealAmount,
                success:  true 
              })   
            }
          } else {
            res.send({
              message: "You can steal one time per day",
              success:  false    
            })
          }
        }
      }
    }
      
  } catch (error) {
    res.send({
      message: "server error",
      success:  false    
    }) 
  }
};


// get current users friend count
exports.upgradeLevelUpToken = async (req, res) => {
  if (!req.body.id || !req.body.amount) {
    res.send({
      message: "telegram id or token amount is not valid",
      success: false
    });
    return;
  }
 
  const result = await User.upgradeLevelUpToken(req.body.id, req.body.amount);
  
  if(result.error) {
    res.send({
      message: "bad request",
      success:  false
    })  
  } else {
    res.send({
      message: {...result.result, token_per_referral: 100},
      success:  true 
    })
  }
};

// get current users friend count
exports.getCurrentLevel = async (req, res) => {
  if (!req.query.id) {
    res.send({
      message: "telegram id  is not valid",
      success: false
    });
    return;
  }
 
  const result = await User.getCurrentLevel(req.body.id);
  
  if(result.error) {
    res.send({
      message: "bad request",
      success:  false
    })  
  } else {
    res.send({
      message: result.result,
      success:  true 
    })
  }
};

// get current ton rate for '
exports.getTonRate = async (req, res) => {
  const result = await User.getTonRate();
  
    res.send({
      message:  result.result,
      success:  !result.error 
    })
  
};

exports.getAdminAddress = async (req, res) => {
  const result = await User.getAdminWalletAddress();
  
    res.send({
      message:  result.result,
      success:  !result.error 
    })
  
};

exports.deposit = async (req, res) => {
  if(!req.body.id || !req.body.transactionHash || !req.body.isToken || !req.body.amount) {
    res.send({
      message: 'invalid parameter',
      success: false
    });
    return;
  }
  try {
    //validate transaction
   
    //get amount  and increase token or xp
    const rateResult = await User.getTonRate();
    if(rateResult.error) {
      res.send({
        message: 'server error',
        success: false
      })
    }  else {
      let udpateAmountResult;
      if(req.body.isToken) {
        udpateAmountResult = await User.updateAmountOrXP(req.body.id,req.body.amount * rateResult.result.ton2token, 0) 
      } else {
        udpateAmountResult = await User.updateAmountOrXP(req.body.id,req.body.amount * rateResult.result.ton2xp, 0) 
      }
      udpateAmountResult.result.affectedRows == 1 ? res.send({message: 'updated successfully', success: true}) : res.send({message: 'invalid action', success: false})
    }
  } catch (error) {
    res.send({message: 'server error', success: false})  
  }
  
};
