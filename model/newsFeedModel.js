const mongoose = require('mongoose');
const NewsFeed = mongoose.Schema({

    userId: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default:0,
        required: true
    },
    image: {
        type: String,
        required: true
    }


})
module.exports = mongoose.model('NewsFeed', NewsFeed);