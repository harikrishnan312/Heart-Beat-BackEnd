const mongoose = require('mongoose');
const User = mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    age: {
        type: Date,
    },
    mobile: {
        type: Number,
    },
    gender: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
          },
          coordinates: {
            type: [Number],
            index: '2dsphere'
          },
          placeName: {
            type: String,
        }

    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    token: {
        type: Number
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    image: {
        type: String
    },
    interests: {
        type: Array
    },
    about: {
        type: String
    },
    images: {
        type: Array
    },
    liked:{
        type:Array,
        default:[]
    },
    likesYou:{
        type:Array,
        default:[]
    },
    matches:{
        type:Array,
        default:[]
    },
    PremiumPurchased: {
        type: Boolean,
        default: false
    }




})
module.exports = mongoose.model('User', User);