const mongoose = require("mongoose")
const {Schema} = mongoose

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
    profilePic: {
        type: String, // cloudinary url
        required: true,
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
    ]
}, {timestamps: true})

const User = mongoose.Schema("User", userSchema)

module.exports = User;