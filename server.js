var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var port = process.env.PORT || 2000;
var online = 0;
var players = [];

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/assets/:Image', function (req, res){
  res.sendFile(__dirname + '/assets/' + req.params.Image);
});

app.get('/raycasting.js', function (req, res){
  res.sendFile(__dirname + '/raycasting.js');
});

app.get('/socket.io/socket.io.js', function (req, res){
  res.sendFile(__dirname + '/socket.io/socket.io.js');
});

io.on('connection', function(socket){
  socket.on('newconnection', function(){
      console.log('player has connected');
	  socket.pID = online;
      online += 1;
      socket.emit('setup', online);
      socket.join('lobby');
      io.sockets.emit('updateOnline', online);
  });
  
  socket.on('disconnect', function(){
    console.log('player has disconnected');
    io.sockets.in('lobby').emit('disconnection', socket.pID);
    online -= 1;
    io.sockets.emit('updateOnline', online);
  });
  
  socket.on('move', function(room, id, x, y){
    io.sockets.in(room).emit('newMove', id, x, y);
  });
  
  socket.on('log', function(msg){
    console.log(msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});



