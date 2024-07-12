const { Router } = require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer.middleware");
const { createDish, uploadDishImage,getDishes } = require("../controllers/dish.controller");


const dishRouter = Router()
dishRouter.use(verifyJWT)

dishRouter.route("/createDish").post(createDish)

dishRouter
  .route("/uploadDishImg")
  .post(verifyJWT, upload.single("dishImg"), uploadDishImage);

  dishRouter.route("/getDishes/:restaurantId").get(getDishes)

module.exports = dishRouter