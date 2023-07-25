
require('dotenv').config();

const emailUser = process.env.EMAILUSER;
const emailPassword = process.env.PASSWORD;

const Db = () => {
    const mongoose = require('mongoose');
    mongoose.set('strictQuery', false);
    mongoose.connect("mongodb://127.0.0.1:27017/" + "Heart-Beat").then(()=>{
        console.log('mongo Db connected');
    });

    // mongoose.connect(process.env.DATAURL)
    // .then(()=>{ console.log('mongo Db connected');}
       
    // );
}

module.exports = {
    emailUser,
    emailPassword,
    Db
}