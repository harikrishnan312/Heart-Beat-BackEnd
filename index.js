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

const server = app.listen(8000, () => {
  console.log(`Server is running on port 8000.`);
});

const io = require('socket.io')(server,{
  pingTimeout:60000,
  cors:{
    origin:"http://localhost:5173"
  }
})

io.on("connection",(socket)=>{
  console.log("connected to socket.io");

  socket.on('set up',(userData)=>{
socket.join(userData);
console.log(userData);
socket.emit('connected');
  });
  
  socket.on('join chat',(room)=>{
    socket.join(room);
    console.log('User joined Room :'+ room);
  });
});