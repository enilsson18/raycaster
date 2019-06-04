var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var port = process.env.PORT || 2000;
var online = 0;
var players = [];
var roomList = ["lobby"];

var update = setInterval(function(){
	for (var i = 0; i < roomList.length; i++){
		io.sockets.in(roomList[i]).emit("update", roomList[i]);
	}
},10);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/assets/:Image', function (req, res){
  res.sendFile(__dirname + '/assets/' + req.params.Image);
});

app.get('/raycasting.js', function (req, res){
  res.sendFile(__dirname + '/raycasting.js');
});

io.on('connection', function(socket){
  socket.on('newconnection', function(name){
      console.log('player has connected');
	  socket.pID = online;
	  socket.username = name;
      online += 1;
      socket.emit('setup', online, "lobby");
      socket.join('lobby');
	  roomList[roomList.indexOf('lobby')].push(socket.pID);
      io.sockets.emit('updateOnline', online);
  });
  
  socket.on('disconnect', function(){
	room = io.sockets.manager.roomClients[socket.id];
    console.log('player has disconnected');
    online -= 1;
	roomList[room].remove(roomList[room].indexOf(socket.pID));
    io.sockets.emit('updateOnline', online);
  });
  
  socket.on('move', function(room, data){
	roomList[roomList.indexOf(room)][roomList[roomList.indexOf(room)].indexOf(data.id)].data = data;
  });
  
  socket.on('log', function(msg){
    console.log(msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});



