const { Router } = require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer.middleware");
const { createDish, uploadDishImage,getDishes,deleteDish,updateDish } = require("../controllers/dish.controller");


const dishRouter = Router()
dishRouter.use(verifyJWT)

dishRouter.route("/createDish").post(createDish)

dishRouter
  .route("/uploadDishImg")
  .post(verifyJWT, upload.single("dishImg"), uploadDishImage);

  dishRouter.route("/getDishes/:restaurantId").get(getDishes)
  dishRouter.route("/deleteDish/:dishId").delete(deleteDish)
  dishRouter.route("/updateDish/:dishId").put(updateDish)

module.exports = dishRouter