var px,py;
var startHitpoints = 3;
var playerHP = startHitpoints;
var score=0;
var pw = 50, ph = 30;
var smallExplosion = 20;
var mediumExplosion = 50;
var largeExplosion = 100;
//var particlesPerExplosion = 20;
var particlesMinSpeed     = 3;
var particlesMaxSpeed     = 10;
var particlesMinSize      = 1;
var particlesMaxSize      = 3;
var explosions = [];

var scoreForchopperShot = 100;
var scoreForTrooperShot = 50;
var scoreForParachuteShot = 75;

var defaultCannonAng = -Math.PI/2;
var cannonAngLimit = Math.PI*0.42;
var clen=40,cang=defaultCannonAng,cAngVel=0.1;
var cEndX, cEndY;
var cShotSpeed = 8;
var cReloadFrames = 5;
var cReloadLeft = 0;

var enemySpawnBandThickness = 200;
var enemySpawnBandMargin = 50;

var enemySpeed = 4;
var ew = 100, eh = 40;
var dropBelowChopperMargin = 10;
var tw = 17, th = 25;
var parachuteW = tw+15, parachuteH = 25;
var trooperFallSpeedNoChute = 3.5;
var trooperFallSpeedWithChute = 1.5;
var troopWalkSpeed = 1;
var dropMarginFromCenter = pw + 30;
var dropMarginFromEdge = 50;
var chuteThickness = 100;
var chuteMargin = 300;

var holdLeft=false, holdRight=false;
var holdFire=false;

var shotList=[];
var enemyList=[];
var trooperList=[];
var canvas;
var canvasContext;
var choppperRight;
var choppperLeft;
var parachute;
var trooper;

window.onload = function() {
    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);
    canvasContext = canvas.getContext("2d");
    setInterval(update,1000/30);
    setInterval(enemySpawn,1000*4);
    cEndX = px = canvas.width/2;
    cEndY = py = canvas.height-ph;
    document.addEventListener("keydown",keyPress);
    document.addEventListener("keyup",keyRelease);
    chopperRight = new Image();
    chopperRight.src = "assets/chopperRight.png";
    chopperLeft = new Image();
    chopperLeft.src = "assets/chopperLeft.png";
    parachute = new Image();
    parachute.src = "assets/parachute.png";
    trooper = new Image();
    trooper.src = "assets/trooper.png";
}

function enemySpawn() {
    var newEnemy = {};

    newEnemy.removeMe = false;

    if(Math.random()<0.5) {
        newEnemy.x = -ew/2;
        newEnemy.xv = 4;
    } else {
        newEnemy.x = canvas.width+ew/2;
        newEnemy.xv = -4;
    }
    newEnemy.y = Math.random() * enemySpawnBandThickness + enemySpawnBandMargin;
    newEnemy.yv = 0;
    var validXPixelTopDrop = 0;

    var safeToDropHere = false;
    while(safeToDropHere == false) {
        safeToDropHere = true;
		
        validXPixelTopDrop = Math.random() * canvas.width;
        if(validXPixelTopDrop < dropMarginFromEdge) {
            safeToDropHere = false;
        } else if(validXPixelTopDrop > canvas.width - dropMarginFromEdge) {
            safeToDropHere = false;
        } else if( Math.abs(canvas.width/2-validXPixelTopDrop) < dropMarginFromCenter) {
            safeToDropHere = false;
        }
    }

    newEnemy.dropX = validXPixelTopDrop;

    newEnemy.hasDroppedYet = false;

    enemyList.push(newEnemy);
}

function update() {
    clearScreen();

    handleInput();

    handleShots();

    handleEnemies();

    drawPlayer();

    drawExplosion();

    debugDraw();

}

function resetGame() {
    shotList=[];
    enemyList=[];
    trooperList=[];
    score=0;
    playerHP = startHitpoints;
}

function debugDraw() {
    canvasContext.fillStyle = "cyan";
    var lineHeight = 15;
    var drawTextOutY = 100;
    canvasContext.fillText("hitpoints: " + playerHP,100,drawTextOutY);
    drawTextOutY+=lineHeight;
    canvasContext.fillText("score: " + score,100,drawTextOutY);
    drawTextOutY+=lineHeight;
    canvasContext.fillText("shots: " + shotList.length,100,drawTextOutY);
    drawTextOutY+=lineHeight;
    canvasContext.fillText("choppers: " + enemyList.length,100,drawTextOutY);
    drawTextOutY+=lineHeight;
    canvasContext.fillText("troops: " + trooperList.length,100,drawTextOutY);
}

function spawnTroop(fromchopper) {
    trooperList.push( {x:fromchopper.x, y:fromchopper.y+dropBelowChopperMargin, removeMe:false,
        isChuteDrawn:false, chuteY:Math.random()*chuteThickness+chuteMargin,
        alreadyGotDrawn:false, isWalking:false} );
}


function handleEnemies() {
    // choppers
    //canvasContext.fillStyle = "green";
    for(var i=0;i<enemyList.length;i++) {
        //drawChopper(enemyList[i].x - ew / 2, enemyList[i].y - eh / 2, ew, eh);
        //canvasContext.fillRect(enemyList[i].x-ew/2,enemyList[i].y-eh/2,ew,eh);
        var movingLeft = enemyList[i].xv < 0;
        var movingRight = enemyList[i].xv > 0;
        if (movingRight) {
            canvasContext.drawImage(chopperRight, enemyList[i].x - ew / 2, enemyList[i].y - eh / 2, ew, eh);
        }
        else {
            canvasContext.drawImage(chopperLeft, enemyList[i].x - ew / 2, enemyList[i].y - eh / 2, ew, eh);
        }
        enemyList[i].x += enemyList[i].xv;
        enemyList[i].y += enemyList[i].yv;


        if(enemyList[i].hasDroppedYet == false) {
            if( (movingLeft && enemyList[i].x < enemyList[i].dropX) ||
				(movingRight && enemyList[i].x > enemyList[i].dropX)) {
                enemyList[i].hasDroppedYet = true;
                spawnTroop(enemyList[i]);
            } // crossing drop line
        } else {
            if( (movingLeft && enemyList[i].x < -ew/2) ||
				(movingRight && enemyList[i].x > canvas.width+ew/2) ) {
                enemyList[i].removeMe = true;
            }
        }
    } // for each chopper
    for(var i=enemyList.length-1;i>=0;i--) {
        if(enemyList[i].removeMe) {
            enemyList.splice(i,1);
        }
    }

    // paratroopers
    for(var i=0;i<trooperList.length;i++) {
        //canvasContext.fillStyle = '#005500';
        //canvasContext.fillRect(trooperList[i].x-tw/2,trooperList[i].y-th,tw,th);
        canvasContext.drawImage(trooper, trooperList[i].x - tw / 2, trooperList[i].y - th, tw, th);
        if(trooperList[i].isWalking) {
            if(trooperList[i].x<px) {
                trooperList[i].x += troopWalkSpeed;
            }
            if(trooperList[i].x>px) {
                trooperList[i].x -= troopWalkSpeed;
            }
            if( Math.abs(trooperList[i].x - px) < (pw/2-tw/2) ) {
                trooperList[i].removeMe = true;
                playerHP--;
                if(playerHP<=0) {
                    resetGame();
                }
            }
            continue; // skip rest of draw and motion code which are only for air travel
        }

        if(trooperList[i].isChuteDrawn) {
            canvasContext.fillStyle = "gray";
            trooperList[i].chuteX = trooperList[i].x-parachuteW/2; 
            trooperList[i].chuteY = trooperList[i].y-th-parachuteH;
            //canvasContext.fillRect(trooperList[i].chuteX,trooperList[i].chuteY,
			//					parachuteW,parachuteH);
            canvasContext.drawImage(parachute,trooperList[i].chuteX, trooperList[i].chuteY,
								parachuteW, parachuteH);
        }

        if(trooperList[i].alreadyGotDrawn == false &&
			trooperList[i].y > trooperList[i].chuteY) {

            trooperList[i].isChuteDrawn = true;
            trooperList[i].alreadyGotDrawn=true;
        }
        trooperList[i].y += (trooperList[i].isChuteDrawn ? trooperFallSpeedWithChute : trooperFallSpeedNoChute);

        if(trooperList[i].y > canvas.height) { // landing on ground
            if(trooperList[i].isChuteDrawn) {
                trooperList[i].y = canvas.height;
                trooperList[i].isWalking = true;
            } else {
                trooperList[i].removeMe = true;
                explosions.push(
                 new explosion(trooperList[i].x, trooperList[i].y,smallExplosion)
                );
            }
        }
    }
    for(var i=trooperList.length-1;i>=0;i--) {
        if(trooperList[i].removeMe) {
            trooperList.splice(i,1);
        }
    }
} // handleEnemies

// Returns an random integer, positive or negative
// between the given value
function randInt(min, max, positive) {

    var num;
    if (positive === false) {
        num = Math.floor(Math.random() * max) - min;
        num *= Math.floor(Math.random() * 2) === 1 ? 1 : -1;
    } else {
        num = Math.floor(Math.random() * max) + min;
    }

    return num;

}

// Draw explosion(s)
function drawExplosion() {

    if (explosions.length === 0) {
        return;
    }

    for (var i = 0; i < explosions.length; i++) {

      var explosion = explosions[i];
      var particles = explosion.particles;

      if (particles.length === 0) {
        explosions.splice(i, 1);
        return;
    }

    var particlesAfterRemoval = particles.slice();
for (var ii = 0; ii < particles.length; ii++) {

  var particle = particles[ii];

    // Check particle size
    // If 0, remove
  if (particle.size <= 0) {
    particlesAfterRemoval.splice(ii, 1);
    continue;
}

  canvasContext.beginPath();
  canvasContext.arc(particle.x, particle.y, particle.size, Math.PI * 2, 0, false);
  canvasContext.closePath();
  canvasContext.fillStyle = 'rgb(' + particle.r + ',' + particle.g + ',' + particle.b + ')';
  canvasContext.fill();

    // Update
  particle.x += particle.xv;
  particle.y += particle.yv;
    //gravity
  particle.yv += .2;

  particle.size -= .1;
}

explosion.particles = particlesAfterRemoval;

}

}



// Explosion
function explosion(x, y, size) {

    this.particles = [];

    for (var i = 0; i < size; i++) {
      this.particles.push(
        new particle(x, y)
      );
    }

}

// Particle
function particle(x, y) {
    this.x    = x;
    this.y    = y;
    this.xv   = randInt(particlesMinSpeed, particlesMaxSpeed, false);
    this.yv   = randInt(particlesMinSpeed, particlesMaxSpeed, false);
    this.size = randInt(particlesMinSize, particlesMaxSize, true);
    this.r    = randInt(0, 255);
    this.g    =  randInt(0, 255);
    this.b    = randInt(0, 255);
}




function handleShots() {
    canvasContext.fillStyle = "red";
    for(var i=0;i<shotList.length;i++) {
        canvasContext.fillRect(shotList[i].x-1,shotList[i].y-1,3,3);
        shotList[i].x += shotList[i].speed * Math.cos(shotList[i].moveAng);
        shotList[i].y += shotList[i].speed * Math.sin(shotList[i].moveAng);

        // note: note checking screen bottom since we can't shoot down
        if(shotList[i].x<0 || shotList[i].x>canvas.width || shotList[i].y<0) {
            shotList[i].removeMe = true;
        }

        for(var e=0;e<enemyList.length;e++) {
            if(shotList[i].y > enemyList[e].y-eh/2 && shotList[i].y < enemyList[e].y+eh/2 &&
			   shotList[i].x > enemyList[e].x-ew/2 && shotList[i].x < enemyList[e].x+ew/2) {
			   
                score += scoreForchopperShot;
                enemyList[e].removeMe=true;
                shotList[i].removeMe = true;
                explosions.push(
                  new explosion(enemyList[e].x, enemyList[e].y,mediumExplosion)
                );
            }
        }
        for(var t=0;t<trooperList.length;t++) {
            if(shotList[i].y > trooperList[t].y-th && shotList[i].y < trooperList[t].y &&
			   shotList[i].x > trooperList[t].x-tw/2 && shotList[i].x < trooperList[t].x+tw/2) {
			   
                score += scoreForTrooperShot;
                trooperList[t].removeMe=true;
                shotList[i].removeMe = true;
                explosions.push(
                  new explosion(trooperList[t].x, trooperList[t].y,smallExplosion)
                );

            } else if(shotList[i].y > trooperList[t].chuteY && shotList[i].y < trooperList[t].chuteY+parachuteH
				 && shotList[i].x > trooperList[t].chuteX && shotList[i].x < trooperList[t].x+parachuteW) {
			   	
                score += scoreForParachuteShot;
                trooperList[t].isChuteDrawn = false;
            }
        }
    }

    for(var i=shotList.length-1;i>=0;i--) {
        if(shotList[i].removeMe) {
            shotList.splice(i,1);
        }
    }
}

function clearScreen() {
    canvasContext.fillStyle="black";
    canvasContext.fillRect(0,0,canvas.width,canvas.height);
}

function handleInput() {
    if(holdFire) {
        if(cReloadLeft <= 0) {
            shotList.push({x:cEndX,y:cEndY,moveAng:cang,speed:cShotSpeed,removeMe:false});
            cReloadLeft = cReloadFrames;
        }
    }
    if(cReloadLeft>0) {
        cReloadLeft--;
    }
    if(holdLeft) {
        cang -= cAngVel;
    }
    if(holdRight) {
        cang += cAngVel;
    }
    if(cang < defaultCannonAng-cannonAngLimit) {
        cang = defaultCannonAng-cannonAngLimit;
    }
    if(cang > defaultCannonAng+cannonAngLimit) {
        cang = defaultCannonAng+cannonAngLimit;
    }
}

function drawPlayer() {
    // cannon
    canvasContext.strokeStyle="yellow";
    canvasContext.lineWidth=12;
    canvasContext.beginPath();
    canvasContext.moveTo(px,py);
    cEndX = px+(clen*2)*Math.cos(cang);
    cEndY = py+(clen*2)*Math.sin(cang);
    canvasContext.lineTo(cEndX,cEndY);
    canvasContext.stroke();

    // base
   // canvasContext.fillStyle="blue";
   // canvasContext.fillRect(px - pw / 2, py, pw, ph);
    canvasContext.beginPath();
    canvasContext.arc(px , py+ph, pw,Math.PI ,0 , false);
    canvasContext.closePath();
    canvasContext.lineWidth = 5;
    canvasContext.fillStyle = 'blue';
    canvasContext.fill();
    canvasContext.strokeStyle = '#000055';
    canvasContext.stroke();
}

function keyPress(evt) {
    switch(evt.keyCode) {
        case 32:
            holdFire = true;
            break;
        case 37:
            holdLeft = true;
            break;
        case 39:
            holdRight = true;
            break;
    }
}
function keyRelease(evt) {
    switch(evt.keyCode) {
        case 32:
            holdFire = false;
            break;
        case 37:
            holdLeft = false;
            break;
        case 39:
            holdRight = false;
            break;
    }
}
