const mongoose = require('mongoose');
const ReportedUser = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    count:{
        type:Number,
        default:1
    }


}
)
module.exports = mongoose.model('ReportedUser', ReportedUser);