const mongoose = require('mongoose');
const Admin = mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }


})
module.exports = mongoose.model('Admin', Admin);