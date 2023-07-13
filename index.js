const express = require('express');
const app = express();

const config = require('./config/config')

const cors = require('cors');

config.Db()

const path = require('path')

app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


const userRoute = require('./routes/userRoute')
app.use('/', userRoute)
const adminRoute = require('./routes/adminRoute')
app.use('/admin', adminRoute)

app.listen(8000, () => {
  console.log(`Server is running on port 8000.`);
});

