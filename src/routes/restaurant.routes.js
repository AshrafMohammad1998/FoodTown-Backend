const {Router} = require("express")
const verifyJWT = require("../middlewares/auth.middleware")

const restaurantRouter = Router()

restaurantRouter.use(verifyJWT)

module.exports = restaurantRouter