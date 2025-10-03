require("dotenv").config();
const {v2: cloudinary} = require("cloudinary");  

/* 
    Cloudinary Configuration

  this file configures the Cloudinary SDK using environment variables.
  Cloudinary is used for image/file uploads and management in the app.
*/

// initialize Cloudinary with credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;