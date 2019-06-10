var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var port = process.env.PORT || 2000;
var online = 0;
var roomList = [0];

var update = setInterval(function(){
	for (var i = 0; i < roomList.length; i++){
		for (var j = 0; j < roomList.length; j++){
			io.sockets.in(i).emit("update", roomList[i][j]);
		}
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
      socket.emit('setup', online, 0);
      socket.join(0);
	  socket.room = 0;
	  online += 1;
	  roomList[0] += 1;
      io.sockets.emit('updateOnline', online);
	  //console.log(roomList[0]);
  });
  
  socket.on('disconnect', function(){
    console.log('player has disconnected');
    online -= 1;
	roomList[socket.room] -= 1;
    io.sockets.emit('updateOnline', online);
	//console.log(roomList[0]);
  });
	
  socket.on('fire', function(room, playerID, x, y, rot){
	 io.sockets.in(room).emit('newBullet', playerID, x, y, rot);
  });
  
  socket.on('move', function(room, id, name, activity, x, y, rot){
	io.sockets.in(room).emit("update", id, name, activity, x, y, rot);
  });
  
  socket.on('log', function(msg){
    console.log(msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});



