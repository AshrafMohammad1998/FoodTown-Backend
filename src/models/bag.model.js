const mongoose = require("mongoose")

const bagSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant"
    },
    dishes: [{
        dishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Dish"
        },
        quantity: {
            type: Number,
            default: 1
        }
    }]

}, { timestamps: true })

const Bag = mongoose.model("Bag", bagSchema)

module.exports = Bag