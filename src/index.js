const express = require("express");
const http = require("http");
const port = process.env.PORT || 3000;
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
const Filter = require("bad-words");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("./utils/users");

const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));

io.on("connection", socket => {
  console.log("New WebSocket connected");

  socket.on("join", (options, cb) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if (error) return cb(error);

    socket.join(user.room);

    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(user.username, `${user.username} has joined!`)
      );

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    cb();
  });

  socket.on("sendMessage", (message, cb) => {
    const filter = new Filter();
    const user = getUser(socket.id);

    if (filter.isProfane(message)) return cb("Profanity is not allowed");

    io.to(user.room).emit("message", generateMessage(user.username, message));
    cb();
  });

  socket.on("sendLocation", (lat, long, cb) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${lat},${long}`
      )
    );
    cb();
  });

  socket.on("disconnect", () => {
    const removedUser = removeUser(socket.id);

    if (removedUser) {
      io.to(removedUser.room).emit(
        "message",
        generateMessage("Admin", `${removedUser.username} has left`)
      );

      io.to(removedUser.room).emit("roomData", {
        room: removedUser.room,
        users: getUsersInRoom(removedUser.room)
      });
    }
    console.log("WebSocket disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const generateMessage = (username, message) => ({
  username,
  text: message,
  createdAt: new Date().getTime()
});

const generateLocationMessage = (username, url) => ({
  username,
  url,
  createdAt: new Date().getTime()
});
