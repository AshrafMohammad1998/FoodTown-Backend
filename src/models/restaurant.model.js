const mongoose = require("mongoose")
const Schema = mongoose.Schema

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    mobile: {
        type: Number,
        required: true,
        unique: true,
        trim: true,
    },
    fromTime: {
        type: String,
        required: true,
    },
    toTime: {
        type: String,
        required: true,
    },
    logo: {
        url: {
            type: String, //cloudinary url
            required: true
        },
        publicID: {
            type: String,
            required: true
        }
    },
    cuisines: {
        type: [String],  // This is an array of strings
        required: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps:true})

const Restaurant = mongoose.model("Restaurant", restaurantSchema)

module.exports = Restaurant