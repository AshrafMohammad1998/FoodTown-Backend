const APIResponse = require("../utils/APIResponse");
const Order = require("../models/order.model");
const { mongoose } = require("mongoose");
const APIError = require("../utils/APIError");
const Bag = require("../models/bag.model");

const addOrderDishes = async (req, res) => {
  try {
    const { bagData } = req.body;

    // Calculate orderAmount by iterating through dishes
    let orderAmount = 0;
    bagData.dishes.forEach((dish) => {
      orderAmount += dish.quantity * dish.dishAmount;
    });

    const newOrder = await Order.create({
      userId: bagData.userId,
      restaurantId: bagData.restaurantId,
      dishes: bagData.dishes,
      orderAmount,
    });

    if (!newOrder) {
      return res
        .status(500)
        .json(
          new APIError(500, "Something went wrong while creating new order")
        );
    }

    await Bag.findByIdAndDelete(bagData._id);

    // const updateOrder1 = await Order.findOneAndUpdate(
    //     { userId: bagData.userId, restaurantId: bagData.restaurantId },
    //     {
    //         $addToSet: { dishes: { $each: bagData.dishes } }, // Add all dishes in bagData.dishes array
    //         $set: { status: "Processing", orderAmount: orderAmount }
    //     },
    //     { upsert: true, new: true } // upsert ensures creation if no document found
    // );

    // return res.status(200).json(new APIResponse(200, {updateOrder}, "Order updated successfully"));
    return res
      .status(200)
      .json(new APIResponse(200, newOrder, "Order created successfully"));
  } catch (error) {
    console.log("Order Controller :: Add Order Dishes :: Error: ", error);
    return res
      .status(500)
      .json(new APIResponse(500, {}, "Error adding order dishes"));
  }
};

const getUserOrderDetails = async (req, res) => {
  const { userId } = req.params;
  const userOrders = await Order.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "restaurants",
        localField: "restaurantId",
        foreignField: "_id",
        as: "restaurantData",
      },
    },
    {
      $unwind: "$restaurantData",
    },
    {
      $unwind: "$dishes", // Unwind the dishes array to lookup each dish individually
    },
    {
      $lookup: {
        from: "dishes",
        localField: "dishes.dishId",
        foreignField: "_id",
        as: "dishDetails",
      },
    },
    {
      $unwind: "$dishDetails",
    },
    {
      $group: {
        _id: "$_id",
        userId: { $first: "$userId" },
        restaurantId: { $first: "$restaurantId" },
        dishes: {
          $push: {
            dishId: "$dishes.dishId",
            quantity: "$dishes.quantity",
            dishAmount: "$dishes.dishAmount",
            dishDetails: "$dishDetails",
          },
        },
        status: { $first: "$status" },
        orderAmount: { $first: "$orderAmount" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        restaurantData: { $first: "$restaurantData" },
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        restaurantId: 1,
        dishes: 1,
        status: 1,
        orderAmount: 1,
        createdAt: 1,
        updatedAt: 1,
        "restaurantData.name": 1,
        "restaurantData.address": 1,
        "restaurantData.mobile": 1,
        "restaurantData.fromTime": 1,
        "restaurantData.toTime": 1,
        "restaurantData.logo": 1,
        "restaurantData.cuisines": 1,
        "restaurantData.owner": 1,
        "restaurantData._id": 1,
      },
    },
    {
      $sort: { createdAt: -1 }, // Sort by createdAt field in descending order
    },
  ]);

  return res
    .status(200)
    .json(new APIResponse(200, userOrders, "User orders fetched successfully"));
};

const getPartnerOrderDetails = async (req, res) => {
  const { restaurantId } = req.params;
  const orders = await Order.aggregate([
    {
      $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "customerData",
      },
    },
    {
      $unwind: "$customerData",
    },
    {
      $unwind: "$dishes", // Unwind the dishes array to lookup each dish individually
    },
    {
      $lookup: {
        from: "dishes",
        localField: "dishes.dishId",
        foreignField: "_id",
        as: "dishDetails",
      },
    },
    {
      $unwind: "$dishDetails",
    },
    {
      $group: {
        _id: "$_id",
        userId: { $first: "$userId" },
        restaurantId: { $first: "$restaurantId" },
        dishes: {
          $push: {
            dishId: "$dishes.dishId",
            quantity: "$dishes.quantity",
            dishAmount: "$dishes.dishAmount",
            dishDetails: "$dishDetails",
          },
        },
        status: { $first: "$status" },
        orderAmount: { $first: "$orderAmount" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        customerData: { $first: "$customerData" },
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        restaurantId: 1,
        dishes: 1,
        status: 1,
        orderAmount: 1,
        createdAt: 1,
        updatedAt: 1,
        "customerData.name": 1,
        "customerData.mobile": 1,
        "customerData.email": 1,
      },
    },
    {
      $sort: { createdAt: -1 }, // Sort by createdAt field in descending order
    },
  ]);

  return res
    .status(200)
    .json(
      new APIResponse(200, orders, "Restaurant orders fetched successfully")
    );
};

const updateOrderStatus = async (req, res) => {
  try {
    const { selectedStatus, orderId } = req.body;

    const updateOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: selectedStatus,
        isCompleted: selectedStatus === "Delivered"
      },
      {
        new: true
      }
    )

    if (!updateOrder) {
      return res
        .status(500)
        .json(
          new APIError(500, "Something went wrong while changing the order status")
        );
    }

    return res
      .status(200)
      .json(new APIResponse(200, updateOrder, "Order updated successfully"));
  } catch (error) {
    console.log("Order Controller :: updateOrders :: Error: ", error);
    return res
      .status(500)
      .json(new APIResponse(500, {}, "Error updateOrder"));
  }
};

module.exports = {
  addOrderDishes,
  getUserOrderDetails,
  getPartnerOrderDetails,
  updateOrderStatus
};
