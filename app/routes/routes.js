module.exports = (app) => {
  const users = require("../controllers/user.controller.js");
  const crypto = require("../controllers/crypto.controller.js");
  const taskController = require("../controllers/task.controller.js");
  const admin = require("../controllers/admin.controller.js");
  const plantController = require("../controllers/plant.controller.js");
  const promotionController = require("../controllers/promotion.controller.js");
  const multer = require("multer");
  const path = require("path");
  const { v4: uuidv4 } = require("uuid");

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../storage"));
    },
    filename: (req, file, cb) => {
      const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFileName);
    },
  });
  const upload = multer({ storage });

  var router = require("express").Router();

  app.use("/api", router);

  // user management
  router.post("/auth", users.auth);
  router.get("/user", users.findAll);
  router.get("/friend", users.getFriendCount);
  router.post("/steal", users.stealFriend);
  router.post("/register", users.register);
  router.post("/login", users.login);
  
  //crypto management
  router.get("/trx/:id", crypto.getTrx);
  router.get("/bnb/:id", crypto.getBnb);
  router.post("/generate_trx_address/:id", crypto.generateTrx);
  router.post("/generate_bnb_address/:id", crypto.generateBnb);
  router.get("/withdraw", crypto.getWithdrawList);
  router.put("/withdraw/:id", crypto.updateWithdrawApprove);
  router.post("/withdraw", crypto.withdraw);
  router.get("/transaction/:id", crypto.getTransaction);
  router.get("/friend/:id", crypto.getFriendOperation);
  router.get("/deposit", crypto.getDepositHistory);
  router.get("/wallet", crypto.getWallet)
  
  //task management
  router.get("/tasks/:id", taskController.getTasks); // get all tasks with status
  router.get("/task", taskController.getAll);
  router.post("/task", upload.single("image_url"), taskController.createTask);
  router.delete("/task/:id", taskController.delete);
  router.post("/taskstatus", taskController.createTaskStatus); // check task status

  //----------------------------------------------------------------------------------------------------------------------------------//

  // plant management
  router.get("/plants", plantController.getAllPlant)
  router.get("/plants-list/:id", plantController.getUserPlantList); // get user's landed plant list 
  router.post("/plants-list", plantController.seedNewPlant); // add new plant to user
  router.put("/plants", plantController.harvestPlant); //harvest user's selected plant
  // router.post("/purchase", plantController.purchaseNewPlant); //purchase new plant

  // steal
  // router.get("/steal", users.steal);

  // promotion management
  router.get("/promotion", promotionController.getPromotion); // get active promotion list
  router.get("/past-promotion", promotionController.getPastPromotion); // get past promotion list
  router.post('/promotion', promotionController.addNewPromotion); // admin adds new promotion
  router.get("/promotion-detail", promotionController.getPromotionDetail); // get promotion detail
  // router.put("/promotion/:id", promotionController.update) // admin updates promotion (name)
  router.post("/ticket", promotionController.buyNewTicket); // buy promtion
  router.get("/ticket", promotionController.getTicket);


  //admin management
  router.put('/admin/:id', admin.update);
  router.get('/admin', admin.findOne)
};
