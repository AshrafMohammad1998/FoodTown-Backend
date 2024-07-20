const Contact = require("../models/contact.model");
const APIError = require("../utils/APIError");
const APIResponse = require("../utils/APIResponse");
const mongoose = require("mongoose");
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

const sendQueryMailToAdmin = async (data) => {
  const { name, email, subject, message } = data;
  const htmlFilePath = path.join(
    __dirname,
    "../emailTemplates",
    "contactUsAdmin.html"
  );

  const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  const modifiedHtmlContent = htmlContent
    .replace("{{name}}", name)
    .replace("{{message}}", message)
    .replace("{{email}}", email)
    .replace("{{subject}}", subject);

  const mailOptions = {
    from: "mohammadashraf7005@gmail.com",
    to: "mohammadashraf7005@gmail.com",
    subject: "From Food Town Contact Us Form",
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

const sendQueryMailToUser = async (data) => {
  const { name, email } = data;
  const htmlFilePath = path.join(
    __dirname,
    "../emailTemplates",
    "contactUsUser.html"
  );

  const htmlContent = fs.readFileSync(htmlFilePath, "utf-8");

  const modifiedHtmlContent = htmlContent.replace("{{name}}", name)

  const mailOptions = {
    from: "mohammadashraf7005@gmail.com",
    to: email,
    subject: "Food Town :: Contact Us",
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

const setUserQuery = async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    const updateContactQuery = await Contact.findOneAndUpdate(
      { userId: req.user?._id },
      { name, email, subject, message },
      { new: true }
    );

    if(!updateContactQuery){
        const contactQuery = await Contact.create({
          name,
          email,
          subject,
          message,
          userId: req.user?._id,
        });
    
        if (!contactQuery) {
          return res
            .status(500)
            .json(new APIError(500, "Something went wrong while contact message."));
        }
    }

    const data = { name, email, subject, message };

    sendQueryMailToAdmin(data);
    sendQueryMailToUser(data);

    return res
      .status(200)
      .json(new APIResponse(200, {}, "Successfully submitted your query!"));
  } catch (error) {
    console.log("Contact Controller :: setUserQuery :: Error:", error);
  }
};

module.exports = { setUserQuery };
