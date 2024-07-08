const jwt = require('jsonwebtoken');
const APIError = require("../utils/APIError");
const User = require('../models/user.model');

const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token){
            return res.status(401).json(new APIError(401, "Unauthorized user")) 
        }
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decodeToken?._id).select("-password")
        if (!user){
            return res.status(401).json(new APIError(401, "Invalid jwt token"))
        }
        req.user = user
        next()

    } catch (error) {
        console.log("Auth Middleware :: verify jwt :: error", error)
    }
}

module.exports = verifyJWT