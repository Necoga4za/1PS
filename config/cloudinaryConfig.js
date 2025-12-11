// config/cloudinaryConfig.js

const cloudinary = require('cloudinary').v2;


const configureCloudinary = () => {

    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        console.log(`Cloudinary Configured successfully with Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
        
    } catch (error) {
        console.error("Error configuring Cloudinary:", error.message);
    }
};

module.exports = configureCloudinary;