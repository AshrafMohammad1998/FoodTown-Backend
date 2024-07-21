const { Router } = require("express")
const {registerUser, loginUser, logoutUser, getUserDetails, testEmail, sendEmailOtpController, validateUserController, resetPasswordEmailOTPController,  updateUserPassword, editUserProfile, addAddress} = require("../controllers/user.controller");
const verifyJWT = require("../middlewares/auth.middleware");

const userRouter = Router();

userRouter.route("/registerUser").post(registerUser)
userRouter.route("/login").post(loginUser)
userRouter.route("/logout").post(verifyJWT, logoutUser)
userRouter.route("/getuser/:userId").get(verifyJWT, getUserDetails)
userRouter.route("/testemail").get(testEmail)
userRouter.route("/emailotp").post(sendEmailOtpController)
userRouter.route("/validate-user").post(validateUserController)
userRouter.route("/resetPasswordEmailotp").post(resetPasswordEmailOTPController)
userRouter.route("/resetPassword").post(updateUserPassword)
userRouter.route("/updateUserProfile").post(verifyJWT, editUserProfile)
userRouter.route("/addAddress").post(verifyJWT, addAddress)

module.exports = userRouter