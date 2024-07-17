const Restaurant = require("../models/restaurant.model");
const APIError = require("../utils/APIError");
const APIResponse = require("../utils/APIResponse");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { uploadToCloudinary } = require("../utils/cloudinary");
const User = require("../models/user.model");

// ----------------------- emails section starts here ----------------------------------

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "mubashir2u@gmail.com",
        pass: process.env.EMAIL_PASSWORD,
    },
});


const sendWelcomeEmail = async (data) => {
    const { restaurantName, email } = data;
    const htmlFilePath = path.join(
        __dirname,
        "../emailTemplates",
        "welcomeRestaurant.html"
    );

    const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

    const modifiedHtmlContent = htmlContent.replace("{{restaurantName}}", restaurantName);

    const mailOptions = {
        from: "mubashir2u@gmail.com",
        to: email,
        subject: "Welcome to Food Town",
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

// ----------------------- emails section ends here ------------------------------------

const validateRestaurantDetails = async (restaurantName) => {
    try {
        if (!restaurantName) {
            return {
                isValidRestaurant: false,
                errorStatusCode: 400,
                errorMessage: "Restaurant name is not specified",
            };
        }

        const restaurant = await Restaurant.findOne({ name: restaurantName });

        if (restaurant) {
            return {
                isValidRestaurant: false,
                errorStatusCode: 409,
                errorMessage: "Restaurant already exists",
            };
        }

        return {
            isValidRestaurant: true,
            errorStatusCode: 200,
            errorMessage: "sucess",
        };
    } catch (error) {
        return {
            isValidUser: false,
            errorStatusCode: 500,
            errorMessage: "Internal server error",
        };
    }
};

const verifyHotelExists = async (req, res) => {
    try {
        const { restaurantName } = req.params;

        const { isValidRestaurant, errorStatusCode, errorMessage } =
            await validateRestaurantDetails(restaurantName);

        if (!isValidRestaurant) {
            return res
                .status(errorStatusCode)
                .json(new APIError(errorStatusCode, errorMessage));
        }

        return res
            .status(errorStatusCode)
            .json(new APIResponse(errorStatusCode, {}, errorMessage));
    } catch (error) {
        console.log("Restaurant Controller :: Verify hotel exist :: Error ", error);
    }
};

const registerRestaurant = async (req, res) => {
    try {
        const {
            name,
            password,
            email,
            mobile,
            restaurantName,
            cuisines,
            address,
            fromTime,
            toTime,
            logoUrl,
            logoPublicId,
        } = req.body;
        const emailData = { restaurantName, email }

        const user = await User.create({
            name,
            password,
            email: email.toLowerCase(),
            mobile,
            isOwner: true
        });

        if (!user) {
            return res
                .status(500)
                .json(new APIError(500, "Something went wrong while creating user."));
        }

        const restaurant = await Restaurant.create({
            name: restaurantName,
            address,
            mobile,
            fromTime,
            toTime,
            logo: {
                url: logoUrl,
                publicID: logoPublicId,
            },
            cuisines,
            owner: user._id,
        });

        sendWelcomeEmail(emailData)

        return res
            .status(200)
            .json(new APIResponse(200, { user, restaurant }, "User & Restaurant created successfully."));

        // TODO: send email on registration
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json(new APIError(400, "Duplicate key error: User or Restaurant with the same key already exists."));
        }
        console.log(
            "Restaurant Controller :: Register New Restaurant :: Error ",
            error
        );
    }
};

const uploadRestaurantImage = async (req, res) => {
    const { restaurantName } = req.body;

    try {
        const { isValidRestaurant, errorStatusCode, errorMessage } =
            await validateRestaurantDetails(restaurantName);

        if (!isValidRestaurant) {
            return res
                .status(errorStatusCode)
                .json(new APIError(errorStatusCode, errorMessage));
        }

        const restaurantLocalImg = req.file;

        if (!restaurantLocalImg) {
            return res
                .status(400)
                .json(new APIError(400, "Restaurant image is required"));
        }

        const cloudinaryImgData = await uploadToCloudinary({
            ...restaurantLocalImg,
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
                "Restaurant image uploaded successfully"
            )
        );
    } catch (error) {
        console.log(
            "Restaurant Controller :: Upload Restaurant Image :: Error ",
            error
        );
    }
};

const getRestaurantDetails = async (req, res) => {
    const { userId } = req.params
    try {
        if (!userId) {
            return res.status(400).json(new APIError(400, "UserId is required."))
        }

        const restaurant = await Restaurant.findOne({
            owner: userId
        })

        if (!restaurant) {
            return res.status(409).json(new APIError(409, "Restaurant not found"))
        }

        return res.status(200).json(new APIResponse(200, restaurant, "Restaurant data fetched successfully."))
    } catch (error) {
        console.log(
            "Restaurant Controller :: Get Restaurant Details :: Error ",
            error
        );
    }
}

const getAllUserRestaurants = async (req, res) => {
    const { page } = req.query || 1;

    const itemsPerPage = 8;
    const skipCount = (page - 1) * itemsPerPage;

    try {

        const restaurants = await Restaurant.find()
            .skip(skipCount)
            .limit(itemsPerPage)

        return res.status(200).json(new APIResponse(200, restaurants, "Restaurants fetched successfully"))

    } catch (error) {
        console.log(
            "Restaurant Controller :: Get All User Restaurants :: Error ",
            error
        );
    }
};

const getRestaurantWithDishes = async (req, res) => {
    const { restaurantId } = req.params;
    try {
        if (!restaurantId) {
            return res.status(400).json(new APIError(400, "restaurant id is required."));
        }

        const restaurant = await Restaurant.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(restaurantId) }
            },
            {
                $lookup: {
                    from: "dishes",
                    localField: "_id",
                    foreignField: "restaurant",
                    as: "dishesData"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerData",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                email: 1,
                            }
                        }
                    ]
                }
            },
            {
                $unwind: "$ownerData"
            }
        ])

        return res
            .status(200)
            .json(
                new APIResponse(
                    200,
                    restaurant[0],
                    "Restaurant data fetched successfully."
                )
            );
    } catch (error) {
        console.log(
            "Restaurant Controller :: Get Restaurant with Dishes :: Error ",
            error
        );
    }
};

module.exports = {
    verifyHotelExists,
    registerRestaurant,
    uploadRestaurantImage,
    getRestaurantDetails,
    getAllUserRestaurants,
    getRestaurantWithDishes
};
