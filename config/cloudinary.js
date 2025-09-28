const cloudinary = require('cloudinary').v2
const cloudinarySecret = process.env.CLOUDINARY;


// Configuration
cloudinary.config({
    cloud_name: 'dqgxogdt4',
    api_key: '267588937287829',
    api_secret: cloudinarySecret
});


module.exports = cloudinary;