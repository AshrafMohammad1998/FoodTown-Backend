const mongoose = require("mongoose")
const Schema = mongoose.Schema
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
    },
    mobile: {
        type: Number,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String, // cloudinary url
        required: [true, "Password is required"],
    },
    orders: [
        {
            type: Schema.Types.ObjectId,
            ref : "order"
        } 
    ],
    wishlist: [
        {
            type: Schema.Types.ObjectId,
            ref: "foodItem"
        }
    ],
    isAdmin: {
        type: Boolean,
        default: false
    },
    isOwner: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            name: this.name,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User", userSchema)

module.exports = User;