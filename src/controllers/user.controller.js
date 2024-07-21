const { mongoose } = require("mongoose");
const User = require("../models/user.model");
const APIError = require("../utils/APIError");
const APIResponse = require("../utils/APIResponse");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mohammadashraf7005@gmail.com",
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendWelcomeEmail = async (data) => {
  const { username, userEmail } = data;

  const htmlFilePath = path.join(
    __dirname,
    "../emailTemplates",
    "welcomeEmail.html"
  );

  const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  const modifiedHtmlContent = htmlContent.replace("{{userName}}", username);

  const mailOptions = {
    from: "mohammadashraf7005@gmail.com",
    to: userEmail,
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

const validateUserDetails = async (name, password, email, mobile) => {
  try {
    if (!name || !email || !password || !mobile) {
      return {
        isValidUser: false,
        errorStatusCode: 400,
        errorMessage: "Fill all the fields",
      };
    }

    const userName = await User.findOne({ name });

    if (userName) {
      return {
        isValidUser: false,
        errorStatusCode: 409,
        errorMessage: "User name already exists",
      };
    }

    const userEmail = await User.findOne({ email });

    if (userEmail) {
      return {
        isValidUser: false,
        errorStatusCode: 409,
        errorMessage: "User email already exists",
      };
    }

    const userMobile = await User.findOne({ mobile });

    if (userMobile) {
      return {
        isValidUser: false,
        errorStatusCode: 409,
        errorMessage: "Mobile number already used",
      };
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])/;
    if (password.length < 8 || !passwordRegex.test(password)) {
      return {
        isValidUser: false,
        errorStatusCode: 400,
        errorMessage:
          "Password must be at least 8 characters long and contain at least one uppercase letter and one special character",
      };
    }

    return { isValidUser: true, errorStatusCode: 200, errorMessage: "sucess" };
  } catch (error) {
    return {
      isValidUser: false,
      errorStatusCode: 500,
      errorMessage: "Internal server error",
    };
  }
};

const testEmail = async (req, res) => {
  try {
    sendWelcomeEmail();
    return res.status(200).json(new APIResponse(200, {}, "Email sent"));
  } catch (error) {
    console.log("error while sending email".error);
  }
};

const generateAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateToken();

    return accessToken;
  } catch (error) {
    return { error: "Something went wrong while generating access token" };
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, password, email, mobile } = req.body;

    const { isValidUser, errorStatusCode, errorMessage } =
      await validateUserDetails(name, password, email, mobile);

    if (!isValidUser) {
      return res
        .status(errorStatusCode)
        .json(new APIError(errorStatusCode, errorMessage));
    }

    const user = await User.create({
      name,
      password,
      email: email.toLowerCase(),
      mobile,
    });

    if (!user) {
      return res
        .status(500)
        .json(
          new APIError(500, "Something went wrong while creating the user.")
        );
    }

    const emailData = {
      username: name,
      userEmail: email,
    };

    sendWelcomeEmail(emailData);

    return res
      .status(201)
      .json(new APIResponse(201, user, "User created successfully."));
  } catch (error) {
    console.log("User Route :: Register User Controller :: Error", error);
  }
};

const loginUser = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    let email = null;
    let mobile = null;

    if (Number.isNaN(Number(emailOrMobile))) {
      email = emailOrMobile;
    } else {
      mobile = emailOrMobile;
    }

    if (!emailOrMobile) {
      return res
        .status(400)
        .json(new APIError(400, "Invalid email or mobile."));
    }

    const user = await User.findOne({
      $or: [{ email }, { mobile }],
    });
    if (!user) {
      return res.status(404).json(new APIError(404, "User doesn't exists."));
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json(new APIError(401, "Invalid password."));
    }

    const accessToken = await generateAccessToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password");

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json(
        new APIResponse(
          200,
          { loggedInUser, accessToken },
          "User logged in successfully."
        )
      );
  } catch (error) {
    console.log("User Route :: Login User Controller :: Error", error);
  }
};

const logoutUser = async (req, res) => {
  try {
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .json(new APIResponse(200, {}, "User logut successfully."));
  } catch (error) {
    console.log("UserController :: logoutUser :: error: ", error);
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json(new APIError(400, "user id is missing"));
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res
        .status(400)
        .json(new APIError(400, `${userId} is not a valid id.`));
    }

    const userData = await User.findById(userId).select("-password");

    return res
      .status(200)
      .json(
        new APIResponse(200, userData, "User details fetched successfully.")
      );
  } catch (error) {
    console.log("Get User Details :: user-contollers:: Error: ", error);
  }
};

const sendOtpEmail = async (data) => {
  const { emailOTP, userEmail, username, otpFor } = data;

  const emailSubject =
    otpFor === "email verification" ? "Email Verification" : "Reset Password";

  const htmlFilePath = path.join(
    __dirname,
    "../emailTemplates",
    "emailOtp.html"
  );

  const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  const modifiedHtmlContent = htmlContent
    .replace("{{userName}}", username)
    .replace("{{otp}}", emailOTP)
    .replace("{{reason}}", otpFor);

  const mailOptions = {
    from: "mohammadashraf7005@gmail.com",
    to: userEmail,
    subject: emailSubject,
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

const sendEmailOtpController = async (req, res) => {
  const { password, mobile, emailOTP, email, username, otpFor } = req.body;

  const emailData = { emailOTP, userEmail: email, username, otpFor };
  try {
    const { isValidUser, errorStatusCode, errorMessage } =
      await validateUserDetails(username, password, email, mobile);

    if (!isValidUser) {
      return res
        .status(errorStatusCode)
        .json(new APIError(errorStatusCode, errorMessage));
    }

    sendOtpEmail(emailData);

    return res
      .status(200)
      .json(new APIResponse(200, {}, "Email OTP sent successfully"));
  } catch (error) {
    console.log(
      "User controller :: send email otp controller :: Error :",
      error
    );
  }
};

const resetPasswordEmailOTPController = async (req, res) => {
  const { emailOTP, email, otpFor } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(new APIError(404, "Email not found"));
  }

  const emailData = {
    emailOTP,
    username: user.name,
    otpFor,
    userEmail: email,
  };

  sendOtpEmail(emailData);

  return res
    .status(200)
    .json(new APIResponse(200, {}, "OTP sent successfull."));
};

const updateUserPassword = async (req, res) => {
  const { email, password } = req.body;

  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])/;

  if (password.length < 8 || !passwordRegex.test(password)) {
    return res
      .status(400)
      .json(
        new APIError(
          400,
          "Password must be at least 8 characters long and contain at least one uppercase letter and one special character."
        )
      );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(new APIError(404, "User not found"));
  }
  user.password = password;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new APIResponse(200, {}, "OTP sent successfull."));
};

const validateUserController = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const { isValidUser, errorStatusCode, errorMessage } =
      await validateUserDetails(name, password, email, mobile);

    if (!isValidUser) {
      return res
        .status(errorStatusCode)
        .json(new APIError(errorStatusCode, errorMessage));
    }

    return res
      .status(errorStatusCode)
      .json(new APIResponse(errorStatusCode, {}, errorMessage));
  } catch (error) {
    console.log(
      "User controller :: Validate User Controller :: Error :",
      error
    );
  }
};

const editUserProfile = async (req, res) => {
  try {
    const { name, mobile } = req.body;
    const userId = req.user._id;

    const userName = await User.findOne({ name });

    if (userName && !userName._id.equals(userId)) {
      return res
        .status(409)
        .json(new APIResponse(409, {}, "Username already exists."));
    }

    const userMobile = await User.findOne({ mobile });

    if (userMobile && !userMobile._id.equals(userId)) {
      return res
        .status(409)
        .json(new APIResponse(409, {}, "Mobile Number already exists."));
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          mobile,
        },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new APIResponse(200, updatedUser, "Profile Updated successfully."));
  } catch (error) {
    console.log("User Routes :: Edit Profile :: Error:", error);
  }
};

const addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          address
        }
      },
      {new:true}
    ).select("-password")

    return res
      .status(200)
      .json(new APIResponse(200, user, "Profile Updated successfully."));
  } catch (error) {
    console.log("User Routes :: Edit Profile :: Error:", error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserDetails,
  testEmail,
  sendEmailOtpController,
  validateUserController,
  resetPasswordEmailOTPController,
  updateUserPassword,
  editUserProfile,
  addAddress
};
