const cloudinary = require('cloudinary').v2;
const fs = require("fs");
const path = require("path");
const APIError = require('./APIError');

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// uploading file to cloudinary server from local server
const uploadToCloudinary = async (localFile) => {
    try {
        if (!localFile) return null

        // let folder = ""
        // if (localFile.mimetype.startsWith("image")) {
        //     folder = `images/${localFile.userName}`
        // } else if (localFile.mimetype.startsWith("video")) {
        //     folder = `videos/${localFile.userName}`
        // } else {
        //     folder = `others/${localFile.userName}`
        // }

        const response = await cloudinary.uploader.upload(localFile.path, {
            resource_type: "auto",
            folder: localFile.restaurantName // Set the folder based on file type
        })
        // console.log("File uploaded successfully as:", response.url);
        fs.unlinkSync(localFile.path) // removing the locally saved file as it is saved to cloudinary server
        return response
    } catch (error) {
        fs.unlinkSync(localFile.path) // removing the locally saved file since its failed to be uploaded
    }
}

const deleteFromCloudinary = async (publicId, resourceType) => {

    try {
        console.log(publicId, "PID")
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        return result
    } catch (error) {
        return new APIError(500, "Something went wrong while deleting file")
    }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary }