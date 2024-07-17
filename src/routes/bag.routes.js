const { Router } = require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const { addBag, getBagData, incrementQuantity, decrementQuantity, clearBag, checkDiffRestaurantInBag } = require("../controllers/bag.controller");

const bagRouter = Router()
bagRouter.use(verifyJWT)

bagRouter.route("/addBag/:restaurantId").post(addBag)
bagRouter.route("/getBagData").get(getBagData)
bagRouter.route("/incrementDishQuantity").put(incrementQuantity)
bagRouter.route("/decrementDishQuantity").put(decrementQuantity)
bagRouter.route('/checkBag/:userId').get(checkDiffRestaurantInBag)
bagRouter.route('/clearBag/:userId').delete(clearBag)

module.exports = bagRouter