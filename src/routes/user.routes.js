const { Router } = require("express")
const {registerUser, loginUser, logoutUser} = require("../controllers/user.controller")

const userRouter = Router();

userRouter.route("/registerUser").post(registerUser)
userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(logoutUser)

module.exports = userRouter