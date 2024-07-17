const mongoose = require("mongoose");
const APIError = require("../utils/APIError");
const APIResponse = require("../utils/APIResponse");
const Bag = require("../models/bag.model");

const getBagData = async (req, res) => {
  try {
    const userId = req.user._id;
    const bagData = await Bag.findOne({ userId });
    return res
      .status(200)
      .json(new APIResponse(200, bagData, "Bag data fetched successfully."));
  } catch (error) {
    console.log("Bag Controller :: Get Bag Data :: Error :", error);
    return res
      .status(500)
      .json(
        new APIResponse(500, {}, "An error occurred while fetching bag data.")
      );
  }
};

const incrementQuantity = async (req, res) => {
  const userId = req.user._id;
  const { dishId, restaurantId } = req.body;
  try {
    // First, try to increment the quantity of an existing dish
    const bagData = await Bag.findOneAndUpdate(
      { userId, restaurantId, "dishes.dishId": dishId },
      { $inc: { "dishes.$.quantity": 1 } },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new APIResponse(200, bagData, "Dish quantity incremented successfully")
      );
  } catch (error) {
    console.log("Bag Controller :: Increment Quantity :: Error :", error);
    return res
      .status(500)
      .json(
        new APIResponse(
          500,
          {},
          "An error occurred while incrementing the quantity."
        )
      );
  }
};

const decrementQuantity = async (req, res) => {
  const userId = req.user._id;
  const { dishId, restaurantId } = req.body;

  try {
    // Try to find the bag containing the dish
    let bagData = await Bag.findOne(
      { userId, restaurantId, "dishes.dishId": dishId },
      { "dishes.$": 1 }
    );

    if (!bagData || !bagData.dishes.length) {
      return res
        .status(200)
        .json(new APIResponse(200, {}, "Dish not found in bag"));
    }

    const dish = bagData.dishes[0];

    // Check if the dish quantity is greater than 0
    if (dish.quantity > 0) {
      // Decrement the quantity of the dish
      bagData = await Bag.findOneAndUpdate(
        { userId, restaurantId, "dishes.dishId": dishId },
        { $inc: { "dishes.$.quantity": -1 } },
        { new: true }
      );

      // Check if the dish quantity is now 0, and if so, remove it
      const updatedDish = bagData.dishes.find(
        (d) => d.dishId.toString() === dishId
      );

      if (updatedDish && updatedDish.quantity === 0) {
        await Bag.updateOne(
          { userId, restaurantId },
          { $pull: { dishes: { dishId } } }
        );

        // Retrieve the updated bag data after removal
        bagData = await Bag.findOne({ userId, restaurantId });

        // Check if the dishes array is empty and delete the document if true
        if (bagData.dishes.length === 0) {
          await Bag.deleteOne({ _id: bagData._id });
          return res
            .status(200)
            .json(
              new APIResponse(200, {}, "Bag is empty and has been removed")
            );
        }
      }

      return res
        .status(200)
        .json(
          new APIResponse(
            200,
            bagData,
            "Dish quantity decremented successfully"
          )
        );
    } else {
      return res
        .status(400)
        .json(new APIResponse(400, {}, "Dish quantity is already zero"));
    }
  } catch (error) {
    console.log("Bag Controller :: Decrement Quantity :: Error :", error);
    return res
      .status(500)
      .json(
        new APIResponse(
          500,
          {},
          "An error occurred while decrementing the quantity."
        )
      );
  }
};

const checkDiffRestaurantInBag = async (req, res) => {
  const userId = req.params.userId;

  try {
    const bag = await Bag.findOne({ userId });
    if (bag) {
      return res.status(200).json(new APIResponse(200, { currentRestaurantId: bag.restaurantId }, "Restaurant details checked successfully."));
    } else {
      return res.status(200).json(new APIResponse(200, { currentRestaurantId: null }, "Restaurant details checked successfully."));

    }
  } catch (error) {
    console.log("Bag Controller :: Check Bag :: Error :", error);
    return res
      .status(500)
      .json(
        new APIResponse(500, {}, "An error occurred while checking the bag.")
      );
  }
};

const clearBag = async (req, res) => {
  const userId = req.params.userId;

  try {
    await Bag.deleteMany({ userId });
    return res
      .status(200)
      .json(new APIResponse(200, {}, "Bag cleared successfully."));
  } catch (error) {
    console.log("Bag Controller :: Clear Bag :: Error :", error);
    return res
      .status(500)
      .json(
        new APIResponse(500, {}, "An error occurred while clearing the bag.")
      );
  }
};

const addBag = async (req, res) => {
  const { restaurantId } = req.params;
  const { dishId } = req.body;
  const userId = req.user._id;

  try {
    const updatedBag = await Bag.findOneAndUpdate(
      { userId, restaurantId },
      { $addToSet: { dishes: { dishId, quantity: 1 } } },
      { new: true, upsert: true }
    );

    if (!updatedBag) {
      await Bag.create({
        userId,
        restaurantId,
        dishes: [{ dishId, quantity: 1 }],
      });
    }

    return res
      .status(200)
      .json(new APIResponse(200, {}, "Dish added to bag successfully."));
  } catch (error) {
    console.log("Bag Controller :: Add Bag :: Error :", error);
    return res
      .status(500)
      .json(
        new APIResponse(
          500,
          {},
          "An error occurred while adding the dish to the bag."
        )
      );
  }
};

module.exports = {
  addBag,
  getBagData,
  incrementQuantity,
  decrementQuantity,
  checkDiffRestaurantInBag,
  clearBag,
};
