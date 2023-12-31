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
const adminRoute = require('./routes/adminRoute');
const { log } = require('console');
app.use('/admin', adminRoute)

const server = app.listen(3000, () => {
  console.log(`Server is running on port 3000.`);
});

const io = require('socket.io')(server, {
  cors:true
})
io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on('set up', (userData) => {
    // console.log(userData);
    socket.join(userData);
    socket.emit('connection');
  });

  socket.on('join chat', (room, oldRoom) => {
    if (oldRoom) {
      if (oldRoom.length > 0) {
        socket.leave(oldRoom)
        console.log('User leaved Room :' + oldRoom);
      }
    }
    socket.join(room);
    console.log('User joined Room :' + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on('new message', (newMessageRecieved) => {
    // console.log(newMessageRecieved.content);
    let chat = newMessageRecieved.chat;

    if (!chat.users) return console.log('users not defined');

    chat.users.filter(user => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit('message recieved', newMessageRecieved);
    })
  })

  socket.on("like sent",(id)=>{
    // console.log(id);
    socket.in(id).emit("like received")
  })
  socket.off('set up', () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});