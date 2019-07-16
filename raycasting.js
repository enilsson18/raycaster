var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
canvas.width = (window.innerHeight/3)*4;
canvas.height = window.innerHeight;
var socket = io();
var online;
var playerData = [];
var bullets = [];
var playerID;
var room = 0;
var name;
var moving;

var x, y, rot, fovData;
var fov = 60, quality = 7, accuracy = 0.02;
var standardColor = new color(0,0,255);
var black = new color(0,0,0);
var red = new color(255,0,0);
var speed = 0.08;
var turnSpeed = 4;
var scale = canvas.width/(fov*quality);
var globalScale = canvas.height/969;
var mouseSpeedScale = 8;
var paces = 0;
var inHand = fists;
var cScale = 0.2;
var hp = 100;
var bulletSpeed = 0.5;
var gameOver = false;
var clipAmmo = 30;
var ammo = 90;
var clipSize = 30;
var inGameMenu = false;
var kills = 0;
var noClip = false;

var rockWall = new Image();
rockWall.src = "assets/brick_wall_texture.jpg";
var brickWall = new Image();
brickWall.src = "assets/TileBrick.jpg";
var testWall = new Image();
testWall.src = "assets/testing.png";
var playerImage = new Image();
playerImage.src = "assets/mario.png";
var portal = new Image();
portal.src = "assets/portal.png";

var ch = new Image();
ch.src = "assets/ch.png";

var fists = new Image();
fists.src = "assets/fists.png";
fists.xOffset = 0.3;
fists.yOffset = 0.62;
fists.scale = 1;
fists.damage = 20;
fists.type = "melee";

var knife = new Image();
knife.src = "assets/knife_hand.png";
knife.xOffset = 0.5;
knife.yOffset = 0.7;
knife.scale = 1;
knife.damage = 30;
knife.type = "melee";

var pistol = new Image();
pistol.src = "assets/pistol.png";
pistol.xOffset = 0.04;
pistol.yOffset = 0.08;
pistol.scale = 3;
pistol.damage = 15;
pistol.type = "gun";

var Map;

var spriteList = [];

//reset();

socket.on("setup", function(o, rm){
	kills = 0;
	room = rm;
	online = o;
	playerID = o;
	reset();
});

socket.on('connect', function() {
	name = prompt('Please Enter a Username');
    socket.emit('newconnection', name);
});

socket.on('disconnection', function(id){
	for (var i = 0; i < playerData.length; i++){
		if (playerData[i].id == id){
			playerData.splice(i,1);
			break;
		}
	}
});

socket.on('death', function(ID){
	if (playerID == ID){
		kills += 1;
	}
});

socket.on('newBullet', function(id, nX, nY, nRot, d){
	bullets.push(new bullet(id, nX, nY, nRot, d));
});

socket.on("update", function(id, newName, h, k, activity, nX, nY, nRot){
	var contains = false;
	for (var i = 0; i < playerData.length; i++){
		if (playerData[i].id == id){
			playerData[i] = {id: id, name: newName, health: h, kills: k, gameOver: activity, x: nX, y: nY, rot: nRot};
			contains = true;
			break;
		}
	}
	if (!contains){
		playerData.push({id: id, name: newName, health: h, kills: k, gameOver: activity, x: nX, y: nY, rot: nRot});
	}
	
	//console.log(id + " " + newName + " " + nX + " " + nY + " " + nRot);
	
	for (var i = 0; i < playerData.length; i++){
		//console.log(playerData[i]);
	}
});

function bullet(id, nX, nY, nRot, d){
	this.id = id;
	this.x = nX;
	this.y = nY;
	this.rot = nRot;
	this.damage = d;
}

function Sprite(img, func, nx, ny){
	this.img = img;
	this.func = func;
	this.x = nx;
	this.y = ny;
}

function reset(){
	canvas.requestPointerLock();
	clipAmmo = 30;
	ammo = 90;
	clipSize = 30;
	paces = 0;
	inHand = pistol;
	gameOver = false;
	hp = 100;
  	if (room == 0){
		Map = dungeonMap;
	}
	
	var selectingSpawn = true;
	while (selectingSpawn){
    	for (var i = 0; i < Map.length; i++) {
    	    for (var j = 0; j < Map[i].length; j++) {
				var randNum = Math.floor(Math.random()*20);
    	        if (Map[i][j] == 9 && randNum == 0) {
    	            x = j+0.5;
    	            y = i+0.5;
					selectingSpawn = false;
					break;
    	        }
				else if (Map[i][j] == 11) {
					spriteList.push(new Sprite(portal, function(){socket.emit("joinffa");}, j, i));
				}
    	    }
			if (!selectingSpawn){
				break;
			}
    	}
	}
    rot = 45;
	
	setInterval(keyLoop, 40);
	setInterval(run, 40);
}

function run(){
	if (hp <= 0){
		die();
	}
	
	//draw walls
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
	
	//draw players
	//console.log(playerData);
	for(var i = 0; i < playerData.length; i++){
		var pDist = getDist(x,y,playerData[i].x,playerData[i].y);
		var height = canvas.height/pDist;
		
		if (playerData[i].id != playerID && playerData[i].gameOver == false){
			//console.log(sensePos(playerData[i].x,playerData[i].y));
			ctx.drawImage(playerImage, sensePos(playerData[i].x,playerData[i].y) - (height/scale)/2,(canvas.height-height)/2, height/scale, height);
		}
	}
	
	//draw sprites
	for (var i = 0; i < spriteList.length; i++){
		var pDist = getDist(x,y,spriteList[i].x,spriteList[i].y);
		var height = canvas.height/pDist;
		
		//console.log(sensePos(playerData[i].x,playerData[i].y));
		ctx.drawImage(spriteList.img, sensePos(spriteList[i].x,spriteList[i].y) - (height/scale)/2,(canvas.height-height)/2, height/scale, height);
	}
	
	//draw bullets
	bulletManager();
	
	//draw onscreen info
	drawView();
    MiniMap();
    Menu();
	socket.emit("move",room, playerID, name, hp, kills, gameOver, x, y, rot);
	//console.log({id:playerID, name: name, x:x, y:y, rot:rot});
}

function drawView(){
	ctx.drawImage(ch, canvas.width/2-(ch.height*globalScale*cScale), canvas.height/2-(ch.height*globalScale*cScale)/2, ch.height*globalScale*cScale, ch.height*globalScale*cScale);
	
	ctx.fillStyle = "rgba(0, 0, 0, .6)";
	ctx.fillRect(0, canvas.height*0.94, canvas.width*0.2, canvas.height*0.06);
	ctx.fillRect(canvas.width*0.8, canvas.height*0.94, canvas.width*0.2, canvas.height*0.06);
	ctx.fillStyle = "rgb(255,0,0)";
	ctx.fillRect(canvas.width*0.05,canvas.height*0.955, canvas.width*0.07*hp*0.02, canvas.height*0.03);
	ctx.fillStyle = "#fff";
	ctx.font = "3vh Arial";
	ctx.textAlign = "center";
	ctx.fillText("HP " + hp, canvas.width*0.05, canvas.height*0.98);
	ctx.fillText("Ammo " + clipAmmo + " / " + ammo, canvas.width*0.90, canvas.height*0.98);
	
	drawItem(inHand, paces);
	
	//ingame menu
	if (inGameMenu){
		ctx.fillStyle = "#333";
		ctx.fillRect((canvas.width/3),(canvas.height/6),(canvas.width/3),(canvas.height/6)*4);
		ctx.fillStyle = "#fff";
		ctx.font = "5vh Arial";
        ctx.textAlign = "center";
		ctx.fillText("Online Users: " + (playerData.length-1), canvas.width/2, (canvas.height/6)*1.5);
		ctx.textAlign = "left";
		ctx.font = "3vh Arial";
		for (var i = 1; i < playerData.length; i++){
			ctx.fillText(playerData[i].name, canvas.width/2 - (canvas.height/100)*20, i*(canvas.height/100)*4 + (canvas.height/6)*2);
			
			ctx.fillText("HP:" + playerData[i].health + " K's:" + playerData[i].kills, canvas.width/2 + (canvas.height/100)*3, i*(canvas.height/100)*4 + (canvas.height/6)*2);
		}
		inGameMenu = false;
	}
}

function drawItem(item) {
    var bobX = Math.cos(paces * 2) * globalScale * 6;
    var bobY = Math.sin(paces * 4) * globalScale * 6;
    var left = canvas.width * item.xOffset + bobX;
    var top = canvas.height * item.yOffset + bobY;
    ctx.drawImage(item, left, top, item.width * globalScale * item.scale, item.height * globalScale * item.scale);
}

function bulletManager(){
	for (var i = 0; i < bullets.length; i++){
		//console.log(bullets[i]);
		//move bullet
		bullets[i].x += Math.cos((natRot((bullets[i].rot)))*(Math.PI/180))*bulletSpeed;
    	bullets[i].y += Math.sin((natRot((bullets[i].rot)))*(Math.PI/180))*bulletSpeed;
		
		//collision detection
		//walls
		if ((getQuadrant(bullets[i].x,bullets[i].y) != 0 && getQuadrant(bullets[i].x,bullets[i].y) != 9) || 
			(getQuadrant(bullets[i].x,bullets[i].y) != 0 && getQuadrant(bullets[i].x,bullets[i].y) != 9)) {
			bullets.splice(i,1);
			break;
    	}
		//player
		var margin = 2/7;
		if (bullets[i].x <= x + margin && bullets[i].x >= x - margin &&
			bullets[i].y <= y + margin && bullets[i].y >= y - margin && bullets[i].id != playerID){
			bullets.splice(i,1);
			
			//console.log(bullets[i].damage);
			hp -= bullets[i].damage;
			if (hp <= 0){
				hp = 0;
				die(bullets[i].id);
			}
		}
		
		//draw bullet
		var pDist = getDist(x,y,bullets[i].x,bullets[i].y);
		var height = canvas.height/(pDist*20);
		
		ctx.fillStyle = "#000";
		ctx.beginPath();
		ctx.arc(sensePos(bullets[i].x, bullets[i].y), canvas.height/2, height/2, 0, 2 * Math.PI);
		ctx.fill();
	}
}

function reload(){
	var usedBullets = 30 - clipAmmo;
	ammo -= usedBullets;
	if (ammo < 0){
		clipAmmo = clipAmmo - usedBullets;
		ammo = 0;
		if (clipAmmo < 0){
			clipAmmo = 0;
		}
	} else {
		clipAmmo = 30;
	}
	
	clipAmmo = 30;
	ammo = 90;
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
	var rx = x - (Math.cos(natRot(rot+90)*(Math.PI/180))*0.5);
	var ry = y - (Math.sin(natRot(rot+90)*(Math.PI/180))*0.5);
	
	var dist = getDist(rx,ry,nX,nY);
	var rotDiff;
	
	rotDiff = Math.atan2((nY-ry),(nX-rx))-(rot*(Math.PI/180));
	//rotDiff = Math.acos(nX-x)/Math.asin(nY-y);
	
	/*
	if (x <= nX && y >= nY) {
		rotDiff = Math.acos((y-nY)/dist);
	}
	else if (x <= nX && y >= nY) {
		rotDiff = Math.asin((x-nX)/dist);
	}
	else if (x >= nX && y <= nY) {
		rotDiff = Math.acos((y-nY)/dist);
	}
	else if (x <= nX && y <= nY) {
		rotDiff = Math.asin((x-nX)/dist);
	}
	*/
	var viewDist = (canvas.width/2) / Math.tan(((fov * (Math.PI/180)) / 2));
	var s = viewDist / (Math.cos(rotDiff) * dist);
	s = (canvas.width/2 + Math.tan(rotDiff) * viewDist - s/2);
	
	var collided = false;
	
	//console.log(Math.tan(rotDiff));
	
	var nx = x;
	var ny = y;
	
	for (var i = 1; i < dist; i += 0.05){
		nx += Math.cos(Math.atan2((nY-y),(nX-x)))*0.05;
    	ny += Math.sin(Math.atan2((nY-y),(nX-x)))*0.05;
		if (getQuadrant(nx,ny)){
			collided = true;
			if (nx >= rx-0.2 && nx <= rx+0.2 && ny >= ry-0.2 && ny <= ry+0.2){
				//console.log("abuse");
			} else {
				collided = true;
			}
			break;
		}
	}
	
	if (collided){
		return canvas.width*2;
	}
	
	rotDiff *= (180/Math.PI);
	//console.log(rotDiff);
	
	var nx = x;
	var ny = y;
	
	nx += Math.cos(rot*(Math.PI/180))*dist;
    ny += Math.sin(rot*(Math.PI/180))*dist;
	
	if (getDist(nx,ny,nX,nY) > dist){
		return canvas.width*2;
	} else {
		return s;
	}
	
	//rotDiff -= (rot-(fov/2));
	/*
	rotDiff -= natRot(rot*(Math.PI/180));
	console.log(dist);
	
	var p1 = Math.atan(rotDiff)*dist;
	var p2 = Math.atan((fov*(Math.PI/180) - rotDiff))*dist;
	return ((p1)*((canvas.width)/(p1+p2))) + canvas.width;
	*/
	//return ((rotDiff/0.00001)+(canvas.width/2))-dist/2;
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

function die(ID){
	socket.emit('kill', room, playerID, ID);
	reset();
}

function fire(){
	if (clipAmmo > 0 && inHand.type == "gun"){
		clipAmmo -= 1;
		if (bullets.length == 0){
			socket.emit('fire', room, playerID, x, y, rot, inHand.damage);
		}
		socket.emit('fire', room, playerID, x, y, rot, inHand.damage);
	}
}

document.addEventListener('mousemove', mouseMovement);
canvas.addEventListener('mousedown', mouseClicks);

var keyState = {};
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
		move(rot);
    }
    if (keyState[39]) {
        // right arrow
        rot += turnSpeed;
        rot %= 360;
    }
    if (keyState[40] || keyState[83]) {
        // down arrow
        move(rot+180);
    }
    if (keyState[68]) {
        move(rot+90);
    }
    if (keyState[65]) {
		move(rot-90);
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
	
	//1,2,3
	if (keyState[49]){
		inHand = pistol;
	}
	if (keyState[50]){
		inHand = knife;
	}
	if (keyState[51]){
		inHand = fists;
	}
	
	//r
	if (keyState[82]){
		reload();
	}
	
	//tab
	if (keyState[192]){
		inGameMenu = true;
	}
	
    boundsCheck();
    rot = natRot(rot);
}

function move(nRot){
	var nX = x;
	var nY = y;
	x += Math.cos((natRot((nRot)))*(Math.PI/180))*speed;
    if (getQuadrant(x,y) != 0 && getQuadrant(x,y) != 9 && !noClip) {
        x -= Math.cos((natRot((nRot)))*(Math.PI/180))*speed;
    }
    y += Math.sin((natRot((nRot)))*(Math.PI/180))*speed;
    if (getQuadrant(x,y) != 0 && getQuadrant(x,y) != 9 && !noClip) {
        y -= Math.sin((natRot((nRot)))*(Math.PI/180))*speed;
    }
	paces += Math.sqrt((Math.pow((x-nX),2)+Math.pow((y-nY),2)));
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

//commands
function noclip(code){
	if (code == "meme21"){
		noClip = !noClip;
	}
}