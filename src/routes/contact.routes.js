const { Router } =require("express");
const verifyJWT = require("../middlewares/auth.middleware");
const { setUserQuery } = require("../controllers/contact.controller");

const contactRouter = Router()
contactRouter.use(verifyJWT)

contactRouter.route("/queryform").post(setUserQuery)

module.exports = contactRouter;