const mongoose = require("mongoose")

const dishSchema = new mongoose.Schema({
    dishName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    amount:{
        type:Number,
        required:true
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    dishImage: {
        url: {
            type: String, //cloudinary url
            required: true
        },
        publicID: {
            type: String,
            required: true
        }
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant"
    },
    numberOfOrders:{
        type: Number
    },
    typeOfDish:{
        type:String,
        required:true
    }
}, {timestamps:true})

const Dish = mongoose.model("Dish", dishSchema)

module.exports = Dish