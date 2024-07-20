const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    dishes: [
      {
        dishId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dish",
        },
        quantity: {
          type: Number,
          default: 1,
        },
        dishAmount: {
          type: Number,
          required: true,
        },
      },
    ],
    status: {
        type:String,
        enum:["Waiting", "Processing", "Delivered"],
        default:"Waiting"
    },
    orderAmount: {
      type: Number,
      required: true,
    },
    isCompleted:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
