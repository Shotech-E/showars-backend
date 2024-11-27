const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const opts = {
  overwrite: true,
  invalidate: true,
  resource_type: "auto",
  folder: "assets",
};

module.exports = (image) => {
  // image => base64
  return new Promise((resolve, reject) => {
    // console.log("Starting upload to Cloudinary...");
    cloudinary.uploader.upload(image, opts, (error, result) => {
      if (result && result.secure_url) {
        // console.log("Upload successful:", result.secure_url);
        return resolve(result.secure_url);
      }

      console.error("Error uploading image to Cloudinary:", error);
      return reject({ message: error.message || "Unknown error occurred" });
    });
  });
};
