const { Router } = require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const { addOrderDishes, getUserOrderDetails, getPartnerOrderDetails,updateOrderStatus } = require("../controllers/order.controller")

const orderRouter = Router()
orderRouter.use(verifyJWT)

orderRouter.route("/createOrder").post(addOrderDishes)
orderRouter.route("/getUserOrders/:userId").get(getUserOrderDetails)
orderRouter.route("/getPartnerOrders/:restaurantId").get(getPartnerOrderDetails)
orderRouter.route("/changeOrderStatus").put(updateOrderStatus)

module.exports = orderRouter