const mongoose = require('mongoose');
const { ObjectId } = require("mongodb");
const NewsFeed = mongoose.Schema({

    userId: {
        type: ObjectId,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0,
        required: true
    },
    image: {
        type: String,
        required: true
    }


})
module.exports = mongoose.model('NewsFeed', NewsFeed);