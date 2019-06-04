var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
canvas.width = (window.innerHeight/3)*4;
canvas.height = window.innerHeight;
var socket = io();
var online;
var playerData = [];
var playerID;
var room = "lobby";
var name;

var x, y, rot, fovData;
var fov = 60, quality = 10, accuracy = 0.02;
var standardColor = new color(0,0,255);
var black = new color(0,0,0);
var red = new color(255,0,0);
var speed = 0.08;
var turnSpeed = 4;
var scale = canvas.width/(fov*quality);
var globalScale = canvas.height/969;
var mouseSpeedScale = 8;

var rockWall = new Image();
rockWall.src = "assets/brick_wall_texture.jpg";
var brickWall = new Image();
brickWall.src = "assets/TileBrick.jpg";
var testWall = new Image();
testWall.src = "assets/testing.png";
var playerImage = new Image();
playerImage.src = "assets/mario.png";

var Map;

var testMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,2,2,2,0,1],
    [1,0,1,1,0,0,0,2,0,2,0,1],
    [1,0,1,1,0,0,0,2,0,2,0,1],
    [1,0,1,0,0,0,0,2,0,0,9,1],
    [1,1,1,1,1,1,1,1,1,1,1,1]
];

var dungeonMap = [
   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
   [1,1,1,1,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
   [1,1,1,1,1,0,9,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,1],
   [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,0,1,1,1],
   [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,0,0,0,1],
   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
   [1,1,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,0,0,0,1],
   [1,1,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,1,0,1,1,1],
   [1,1,1,1,1,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1],
   [1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1],
   [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,1,1,1,0,1],
   [1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1],
   [1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,1,1,0,1],
   [1,1,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,1,1,0,1],
   [0,0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,1,1,0,1],
   [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
   [1,0,1,0,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,1],
   [1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1],
   [1,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
   [1,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1,0,1],
   [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

socket.on("setup", function(o, rm){
	room = rm;
	online = o;
	playerID = o-1;
	reset();
});

socket.on('connect', function() {
	name = prompt('Please Enter a Username');
    socket.emit('newconnection', name);
});

socket.on('disconnection', function(id){
	
});

socket.on("update", function(o, list){
	online = o;
	playerData = list;
});

function reset(){
	canvas.requestPointerLock();
  Map = dungeonMap;
    for (var i = 0; i < Map.length; i++) {
        for (var j = 0; j < Map[i].length; j++) {
            if (Map[i][j] == 9) {
                x = j+0.5;
                y = i+0.5;
            }
        }
    }
    rot = 45;

    const loop = setInterval(run, 40);
}

function run(){
    ctx.fillStyle = "#2B2B2B";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    sense();
	
    for (var i = 0; i < fovData.length; i++){
        var height = canvas.height/fovData[i].dist;

        if (fovData[i].isColor) {
            ctx.fillStyle = fovData[i].color;
            ctx.fillRect(i*scale, (canvas.height-height)/2, scale+0.8, height);
        } else {
            ctx.drawImage(fovData[i].pic, fovData[i].picSeg , 0, (fovData[i].pic.width/canvas.width)*scale, fovData[i].pic.height,i*scale,(canvas.height-height)/2, scale+1.5, height);
        }
    }
	
	
	for(var i = 0; i < playerData.length; i++){
		var pDist = getDist(x,y,playerData[i].x,playerData[i].y);
		var height = canvas.height/pDist;
		
		if (i != playerID){
			ctx.drawImage(playerImage, sensePos(playerData[i].x,playerData[i].y),(canvas.height-height)/2, height/scale, height);
		}
	}
	
    MiniMap();
    Menu();
	socket.emit("move",room, {id:playerID, x:x, y:y, rot:rot});
}

function sense2(){
    fovData = [];
    for (var i = 0; i < fov*quality; i++){
        var dist = 0;
        var tX = x;
        var tY = y;
        var finalRot = natRot((rot-(fov/2))+i/quality);
        tX += Math.cos((natRot((rot-(fov/2))+i/quality))*(Math.PI/180))*0.5;
        tY += Math.sin((natRot((rot-(fov/2))+i/quality))*(Math.PI/180))*0.5;
        var ySlope = ((tY-y) / (tX-x)) * (tX-x);
        var xSlope = ((tX-x) / (tY-y)) * (tY-y);
        tX = x;
        tY = y;

        while(getQuadrant(tX,tY) == 0 || getQuadrant(tX,tY) == 9 ){
          if (finalRot > 45 && finalRot <= 135){
            tY = Math.floor(tY);
            tY += 1;
            tX += xSlope;
          } 
          else if (finalRot > 135 && finalRot <= 225) {
            tX = Math.floor(tX);
            tX -= 1;
            tY += ySlope;
          }
          else if (finalRot > 225 && finalRot <= 315) {
            tY = Math.floor(tY);
            tY -= 1;
            tX += xSlope;
          }
          else if (finalRot > 315 || finalRot <= 45) {
            tX = Math.floor(tX);
            tX += 1;
            tY += ySlope;
          }
        }

        dist = Math.sqrt((Math.pow((x-tX),2)+Math.pow((y-tY),2)));

        //console.log(tX + " " + tY + " " + getQuadrant(tX,tY));
        if (getQuadrant(tX,tY) == 1 || getQuadrant(tX,tY) == 2) {
            fovData.push(new fovSeg(dist, true, new Image(), 0, darken(standardColor.r, standardColor.g, standardColor.b,
                canvas.height - dist)));
        }
        /*
        if (getQuadrant(tX,tY) == 2){
            fovData.push(new fovSeg(dist, false, wall, getExactCollision(tX,tY,finalRot, wall), black.getColor()));
        }
        */
    }
}

function sensePos(nX,nY){
	var slope = (nY-y)/(nX-x);
	var pAngle = natRot(Math.atan(slope) * (180/Math.PI)+rot);
	console.log(pAngle);
	return ((natRot(pAngle-rot)/fov)*canvas.width);
}

function sense(){
    fovData = [];
    for (var i = 0; i < fov*quality; i++){
        var dist = 0;
        var tX = x;
        var tY = y;
        var finalRot = rot;
        while(getQuadrant(tX,tY) == 0 || getQuadrant(tX,tY) == 9 ){
            tX += Math.cos((natRot((rot-(fov/2))+i/quality))*(Math.PI/180))*accuracy;
            tY += Math.sin((natRot((rot-(fov/2))+i/quality))*(Math.PI/180))*accuracy;
            finalRot = natRot((rot-(fov/2))+i/quality);
        }

        dist = Math.sqrt((Math.pow((x-tX),2)+Math.pow((y-tY),2)));

        //console.log(tX + " " + tY + " " + getQuadrant(tX,tY));
        if (getQuadrant(tX,tY) == 3){
            fovData.push(new fovSeg(dist, false, testWall, getExactCollision(tX,tY,finalRot, testWall), black.getColor()));
        }
        if (getQuadrant(tX,tY) == 2){
            fovData.push(new fovSeg(dist, false, brickWall, getExactCollision(tX,tY,finalRot, brickWall), black.getColor()));
        }
        if (getQuadrant(tX,tY) == 1){
            fovData.push(new fovSeg(dist, false, rockWall, getExactCollision(tX,tY,finalRot, rockWall), black.getColor()));
        }
        
    }
}

function fovSeg(dist, isColor, pic, picSeg, c) {
    this.dist = dist;
    this.color = c;
    this.isColor = isColor;
    this.pic = pic;
    this.picSeg = picSeg;
}

function color(r,g,b){
    this.r = r;
    this.g = g;
    this.b = b;

    this.getColor = function(){
        return "rgb(" + r + "," + g + "," + b + ")";
    };
}

function getQuadrant(newX, newY){
    return Map[Math.floor(newY)][Math.floor(newX)];
}

function getExactCollision(nX,nY,nRot, pic){
    var slope = (nY-y) / (nX-x);
    var invSlope = -1 * slope;
    var exactPos;
    var corners = [];
    //up left
    corners.push(getDist(nX,nY,Math.floor(nX),Math.floor(nY)));
    //up right
    corners.push(getDist(nX,nY,Math.ceil(nX),Math.floor(nY)));
    //down right
    corners.push(getDist(nX,nY,Math.ceil(nX),Math.ceil(nY)));
    //down left
    corners.push(getDist(nX,nY,Math.floor(nX),Math.ceil(nY)));

    var best = 0;
    for (var i = 0; i < 4; i++){
        if (corners[i] < corners[best]){
            best = i;
        }
    }

    var closest;
    var a = best-1;
    if ((best-1) < 0){
        a = 3;
    }
    if (corners[(best+1)%4] < corners[a]) {
        closest = (best+1)%4;
    } else {
        closest = a;
    }
    
    if ((best === 0 && closest === 1) || (best === 1 && closest === 0)){
        exactPos = ((Math.floor(nY)-nY)/slope) + nX;
    } else if ((best === 1 && closest === 2) || (best === 2 && closest === 1)){
        exactPos = nY + slope *(Math.ceil(nX)-nX);
    } else if ((best === 2 && closest === 3) || (best === 3 && closest === 2)){
        exactPos = ((Math.round(nY)-nY)/slope) + nX;
    } else if ((best === 3 && closest === 0) || (best === 0 && closest === 3)){
        exactPos = nY + slope *(Math.floor(nX)-nX);
    }

    return (exactPos-Math.floor(exactPos))*(pic.width);
}

function getDist(x1,y1,x2,y2){
    return Math.sqrt((Math.pow((x2-x1),2)+Math.pow((y2-y1),2)));
}

function boundsCheck (){
    if (x > Map[0].length){
        x = Map[0].length;
    }
    if (y > Map.length){
        y = Map.length;
    }
    if (x < 0) {
        x = 0;
    }
    if (y < 0) {
        y = 0;
    }
}

function darken (r,g,b, amount){
    var factor = (amount-(950*globalScale))*(5/80);
    r *= factor;
    g *= factor;
    b *= factor;

    if (r<0){
        r = 0;
    }
    if (g<0){
        g = 0;
    }
    if (b<0){
        b = 0;
    }
    if (r > 255) {
        r = 255;
    }
    if (g > 255) {
        g = 255;
    }
    if (g > 255) {
        g = 255;
    }
    return "rgb(" + r + "," + g + "," + b + ")";
}

function MiniMap() {
    var sizeScale = 210/Map.length;
    var mapScale = sizeScale * globalScale;
    var bScale = 20 * globalScale;
    var mapWidth = mapScale * Map[0].length;
    var mapHeight = mapScale * Map.length;
    ctx.fillStyle = "#000";
    ctx.fillRect(bScale/2, bScale/2, mapWidth + bScale, mapHeight + bScale);
    for (var i = 0; i < Map.length; i++) {
        for (var j = 0; j < Map[0].length; j++) {
            if (Map[i][j] == 1){
                ctx.fillStyle = standardColor.getColor();
            } else if (Map[i][j] == 2){
                ctx.fillStyle = red.getColor();
            }
            if (Map[i][j] != 0 && Map[i][j] != 9) {
                ctx.fillRect(bScale + (mapScale * j), bScale + (mapScale * i), mapScale, mapScale);
            }
        }
    }

    if (mapScale/3 < 1){
        mapScale = 3;
    }

    ctx.fillStyle = "#fff";
    ctx.fillRect(bScale + (x * mapScale)-(mapScale/6), bScale + (y * mapScale)-(mapScale/6), mapScale/3, mapScale/3);
}

function Menu(){

}

function fire(){
	
}

document.addEventListener('mousemove', mouseMovement);
canvas.addEventListener('mousedown', mouseClicks);

var keyState = {};
setInterval(keyLoop, 40);
window.document.addEventListener('keydown', function(e) {
    keyState[e.keyCode || e.which] = true;
}, true);
window.document.addEventListener('keyup', function(e) {
    keyState[e.keyCode || e.which] = false;
}, true);

function keyLoop() {
    if (keyState[37]) {
        // left arrow
        rot -= turnSpeed;
    }
    if (keyState[38] || keyState[87]) {
        // up arrow

        x += Math.cos((natRot((rot)))*(Math.PI/180))*speed;
        if (getQuadrant(x,y) != 0 && getQuadrant(x,y) != 9) {
            x -= Math.cos((natRot((rot)))*(Math.PI/180))*speed;
        }
        y += Math.sin((natRot((rot)))*(Math.PI/180))*speed;
        if (getQuadrant(x,y) != 0 && getQuadrant(x,y) != 9) {
            y -= Math.sin((natRot((rot)))*(Math.PI/180))*speed;
        }
    }
    if (keyState[39]) {
        // right arrow
        rot += turnSpeed;
        rot %= 360;
    }
    if (keyState[40] || keyState[83]) {
        // down arrow
        x -= Math.cos((natRot((rot)))*(Math.PI/180))*speed;
        if (getQuadrant(x,y) != 0 && getQuadrant(x,y) != 9) {
            x += Math.cos((natRot((rot)))*(Math.PI/180))*speed;
        }
        y -= Math.sin((natRot((rot)))*(Math.PI/180))*speed;
        if (getQuadrant(x,y) != 0 && getQuadrant(x,y) != 9) {
            y += Math.sin((natRot((rot)))*(Math.PI/180))*speed;
        }
    }
    if (keyState[68]) {
        x += Math.cos((natRot((rot+90)))*(Math.PI/180))*speed;
        if (getQuadrant(x,y) != 0 && getQuadrant(x,y) != 9) {
            x -= Math.cos((natRot((rot+90)))*(Math.PI/180))*speed;
        }
        y += Math.sin((natRot((rot+90)))*(Math.PI/180))*speed;
        if (getQuadrant(x,y) != 0 && getQuadrant(x,y) != 9) {
            y -= Math.sin((natRot((rot+90)))*(Math.PI/180))*speed;
        }
    }
    if (keyState[65]) {
        x += Math.cos((natRot((rot-90)))*(Math.PI/180))*speed;
        if (getQuadrant(x,y) != 0 && getQuadrant(x,y) != 9) {
            x -= Math.cos((natRot((rot-90)))*(Math.PI/180))*speed;
        }
        y += Math.sin((natRot((rot-90)))*(Math.PI/180))*speed;
        if (getQuadrant(x,y) != 0 && getQuadrant(x,y) != 9) {
            y -= Math.sin((natRot((rot-90)))*(Math.PI/180))*speed;
        }
    }
    if (keyState[187]){
        // =/+
        if (quality < 1){
            quality *= 2;
        } else {
            quality += 1;
        }
        scale = canvas.width / (fov * quality);
    }
    if (keyState[189]) {
        // -/_
        if (quality > 1){
            quality -= 1;
        } else {
            quality /= 2;
        }
        scale = canvas.width/(fov*quality);
    }
	
    boundsCheck();
    rot = natRot(rot);
}

function mouseMovement(event){
	if (document.pointerLockElement === canvas){
		rot += event.movementX/(mouseSpeedScale);
		rot = natRot(rot);
	} 
}

function mouseClicks(event){
	if (document.pointerLockElement != canvas){
		if (event.button == 0){
			canvas.requestPointerLock();
		}
	} else {
		fire();
	}
}

function natRot(r){
    if (r < 0){
        return r + 360;
    }
    return r % 360;
}