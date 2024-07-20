const mongoose = require("mongoose");
const APIError = require("../utils/APIError");
const APIResponse = require("../utils/APIResponse");
const Bag = require("../models/bag.model");
const Dish = require("../models/dish.model");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const getBagData = async (req, res) => {
 const {userId} = req.params
  try {
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
      return res
        .status(200)
        .json(
          new APIResponse(
            200,
            { currentRestaurantId: bag.restaurantId },
            "Restaurant details checked successfully."
          )
        );
    } else {
      return res
        .status(200)
        .json(
          new APIResponse(
            200,
            { currentRestaurantId: null },
            "Restaurant details checked successfully."
          )
        );
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
  const { dishId, dishAmount } = req.body;
  const userId = req.user._id;

  try {
    const updatedBag = await Bag.findOneAndUpdate(
      { userId, restaurantId },
      { $addToSet: { dishes: { dishId, quantity: 1, dishAmount } } },
      { new: true, upsert: true }
    );

    if (!updatedBag) {
      await Bag.create({
        userId,
        restaurantId,
        dishes: [{ dishId, quantity: 1, dishAmount }],
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

const getBagDishes = async (req, res) => {
  const { dishIds } = req.params;
  const dishIdsArray = dishIds.split(",");

  try {
    // Convert the dishIdsArray to ObjectId for Mongoose query
    // const dishObjectIds = dishIdsArray.map(id => new mongoose.Types.ObjectId(id));

    const dishObjectIds = dishIdsArray
      .map((id) => id.trim()) // Trim whitespace
      .filter((id) => mongoose.Types.ObjectId.isValid(id)) // Check if the id is valid
      .map((id) => new mongoose.Types.ObjectId(id)); // Convert to ObjectId

    // Find dishes in the database
    const dishes = await Dish.find({ _id: { $in: dishObjectIds } });

    // Send the response back
    return res
      .status(200)
      .json(new APIResponse(200, dishes, "Bag Dishes fetched successfully"));
  } catch (error) {
    console.log("Bag Controller :: Get Bag Dishes :: Error:", error);
  }
};

const setPaymentForm = async (req, res) => {
  const { mergedDishesArray } = req.body;

  // Log the request body to verify its contents

  if (!mergedDishesArray) {
    return res.status(400).json({ error: "mergedDishesArray is required" });
  }

  try {
    const lineItems = mergedDishesArray.map((product) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: product.dishName,
          images: [product.dishImage.url],
        },
        unit_amount: Math.round(product.amount * 100),
      },
      quantity: product.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.CORS_ORIGIN}/payment-success`,
      cancel_url: `${process.env.CORS_ORIGIN}/payment-failure`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addBag,
  getBagData,
  incrementQuantity,
  decrementQuantity,
  checkDiffRestaurantInBag,
  clearBag,
  getBagDishes,
  setPaymentForm,
};
