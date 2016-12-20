// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var rivescript = require('rivescript');
var bot = new rivescript();

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;
  socket.join(socket.username);
  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    bot.loadDirectory("./brain", success_handler, error_handler);
    function success_handler(loadCount) {
      bot.sortReplies();
      var reply = bot.reply(socket.username, data);
      socket.emit('new message', {
        username: "Tesla",
        message: reply
      });
    }

    function error_handler(loadCount, err) {
      socket.to(socket.username).emit('new message', {
        username: socket.username,
        message: "Sorry ! Error occured"
      });
    }

  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    //++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    // socket.broadcast.emit('user joined', {
    //   username: socket.username,
    //   numUsers: numUsers
    // });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.to(socket.username).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.to(socket.username).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.to(socket.username).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
