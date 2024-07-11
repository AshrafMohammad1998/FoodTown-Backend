const { Router } = require("express")
const {registerUser, loginUser, logoutUser, getUserDetails, testEmail, sendEmailOtpController, validateUserController} = require("../controllers/user.controller");
const verifyJWT = require("../middlewares/auth.middleware");

const userRouter = Router();

userRouter.route("/registerUser").post(registerUser)
userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(verifyJWT, logoutUser)
userRouter.route("/getuser/:userId").get(verifyJWT, getUserDetails)
userRouter.route("/testemail").get(testEmail)
userRouter.route("/emailotp").post(sendEmailOtpController)
userRouter.route("/validate-user").post(validateUserController)

module.exports = userRouter