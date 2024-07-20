const { Router } = require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const { addBag, getBagData, incrementQuantity, decrementQuantity, clearBag, checkDiffRestaurantInBag, getBagDishes, setPaymentForm } = require("../controllers/bag.controller");

const bagRouter = Router()
bagRouter.use(verifyJWT)

bagRouter.route("/addBag/:restaurantId").post(addBag)
bagRouter.route("/getBagData/:userId").get(getBagData)
bagRouter.route("/incrementDishQuantity").put(incrementQuantity)
bagRouter.route("/decrementDishQuantity").put(decrementQuantity)
bagRouter.route('/checkBag/:userId').get(checkDiffRestaurantInBag)
bagRouter.route('/clearBag/:userId').delete(clearBag)
bagRouter.route('/getBagDishes/:dishIds').get(getBagDishes)
bagRouter.route('/create-checkout/').post(setPaymentForm)


module.exports = bagRouter