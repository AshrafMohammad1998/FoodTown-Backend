const { mongoose } = require("mongoose");
const APIError = require("../utils/APIError");
const APIResponse = require("../utils/APIResponse");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Dish = require("../models/dish.model");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

// ----------------------email section starts here-----------------------

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mohammadashraf7005@gmail.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendAddedItemEmail = async (data) => {
  const { restaurantName, email, dishName } = data;
  const htmlFilePath = path.join(
    __dirname,
    "../emailTemplates",
    "addedFoodItem.html"
  );

  const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  const modifiedHtmlContent = htmlContent
    .replace("{{restaurantName}}", restaurantName)
    .replace("{{foodItemName}}", dishName);

  const mailOptions = {
    from: "mohammadashraf7005@gmail.com",
    to: email,
    subject: "Dish Added",
    html: modifiedHtmlContent,
    // attachments: [
    //     {
    //         filename: 'logo.png',
    //         path: path.join(__dirname, 'logo.png'),
    //         cid: 'logo' // same cid value as in the HTML img src
    //     }
    // ]
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log("Error while sending email", error);
    }
  });
};

// ----------------------email section ends here-----------------------

const createDish = async (req, res) => {
  try {
    const {
      dishName,
      amount,
      description,
      dishImageURL,
      dishImagePublicId,
      restaurantId,
      typeOfDish,
      restaurantName,
    } = req.body;

    const emailId = req.user.email;

    if (!dishImageURL) {
      return res.status(400).json(new APIError(400, "Dish Image is required"));
    }

    if (!dishImagePublicId) {
      return res
        .status(400)
        .json(new APIError(400, "Dish Public ID is required"));
    }

    if (!restaurantId) {
      return res
        .status(400)
        .json(new APIError(400, "Restaurant id is required"));
    }

    const dish = await Dish.create({
      dishName,
      amount,
      description,
      dishImage: {
        url: dishImageURL,
        publicID: dishImagePublicId,
      },
      owner: req.user._id,
      restaurant: restaurantId,
      typeOfDish,
    });

    if (!dish) {
      return res
        .status(500)
        .json(
          new APIError(500, "Something went wrong while creating the dish.")
        );
    }

    // TODO: send email on of successfull dish creation

    const emailData = {
      dishName: dishName,
      email: emailId,
      restaurantName,
    };

    sendAddedItemEmail(emailData);

    return res
      .status(201)
      .json(new APIResponse(201, dish, "Dish created successfully."));
  } catch (error) {
    console.log("Dish Controller :: Create Dish Controller :: Error", error);
  }
};

const uploadDishImage = async (req, res) => {
  const { restaurantName, oldImgPublicId } = req.body;

  try {

    if (oldImgPublicId) {
      await deleteFromCloudinary(oldImgPublicId, "image");
    }

    const dishLocalImg = req.file;

    if (!dishLocalImg) {
      return res
        .status(400)
        .json(new APIError(400, "Dish image is required"));
    }

    const cloudinaryImgData = await uploadToCloudinary({
      ...dishLocalImg,
      restaurantName,
    });

    // console.log(cloudinaryImgData, "cloudinary img data");

    return res.status(200).json(
      new APIResponse(
        200,
        {
          public_id: cloudinaryImgData.public_id,
          url: cloudinaryImgData.url,
        },
        "Dish image uploaded successfully"
      )
    );
  } catch (error) {
    console.log(
      "Dish Controller :: Upload Dish Image :: Error ",
      error
    );
  }
};

const getDishes = async (req, res) => {
  try{

    const {restaurantId} = req.params
    const dishes = await Dish.find({restaurant: restaurantId})
    
    return res.status(200).json(new APIResponse(200, dishes, "Dishes fetched Successfully."))
  }catch(error){
    console.log(
      "Dish Controller :: Get Dishes :: Error ",
      error
    );
  }
}

module.exports = { createDish, uploadDishImage,getDishes };
