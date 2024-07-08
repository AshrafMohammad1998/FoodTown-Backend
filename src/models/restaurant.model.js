const mongoose = require("mongoose")
const Schema = mongoose.Schema

const restaurantSchema = new Schema({
    name: {
        type: string,
        unique: true,
        required: true,
        trim:true,
        index: true
    }
}, {timestamps: true})

const Restaurant = mongoose.model("Restaurant", restaurantSchema)

module.exports = Restaurant