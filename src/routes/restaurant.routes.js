const { Router } = require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const upload = require("../middlewares/multer.middleware");
const {
  verifyHotelExists,
  registerRestaurant,
  uploadRestaurantImage,
  getRestaurantDetails
} = require("../controllers/restaurant.controller");

const restaurantRouter = Router();

restaurantRouter
  .route("/checkHotelExistence/:restaurantName")
  .get(verifyHotelExists);

restaurantRouter.route("/registerRestaurant").post(registerRestaurant);

restaurantRouter
  .route("/uploadRestaurantImg")
  .post(upload.single("restaurantImg"), uploadRestaurantImage);

restaurantRouter.route("/getRestaurantData/:userId").get(verifyJWT, getRestaurantDetails)

module.exports = restaurantRouter;
