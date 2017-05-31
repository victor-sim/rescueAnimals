// global constant values
// just to keep consistency when calculate point, coordinate... etc...
var nMapWidth = 4000;
var nLakeStart = 2300;
var nLakeEnd = 2600;
var nMapStart = 150;

var oChopperW = 100;
var oChopperH = 75;
var nFireW = 100;
var nFireH = 75
//var nElephantW = 50;
//var nElephantH = 40;



// Enumeration value for game status
var enGameStatus = {
	nInit: 0 // game initiated
	,nReady: 1  // game is ready to play
	,nPlaying: 2 // level started
	,nBoom : 3  // chopper exploded
	,nTimeOver : 4 // Time over
	,nGameOver: 5  // game over due to explosion or orerdue
	,nLevelClear: 6 // level cleared
}


// Enumeration value for chopper motion
var enMotion = {
	nStaying: 0
	,nMoving: 1
	,nTurning: 2
}

// Enumeration value for direction (for chopper and animals)
var enDirection = {
	nLeft: 0
	,nRight: 1
}

// Enumeration value for type of animals
var enAnimalType = {
	nElephant: 0
	,nMoose : 1
	,nLion : 2
	,nSheep : 3
	,nRabbit : 4
	,nChicken : 5
}

// Enumeration value for animal status
var enAnimalStatus = {
	nLand : 0   // animal on land
	,nLoad : 1  // animal loaded on chopper
	,nSaved : 2  // saved. (outside of the playground)
	,nDead : 3   // not implemented.  Dead animal
}

// Global variable to keep chopper's information
var oChopper = {
	nDirection: enDirection.nRight  // chopper's direction (left or right)
	,nMotion: enMotion.nStaying  // chopper's motion status (moving, staying or turning)
	,img : new Image   // chopper's sprites image
	,imgBoom : new Image  // image for explosion
	,nTop: 395   // Y coordinate of chopper
	,nLeft: 0    // X coordinate of chopper
	,nFrame: 0   // chopper's frame
	,bLeft: false   // variables to check key stroke status of user
	,bRight: false
	,bUp: false
	,bDown: false
	,nWidth: oChopperW   
	,nHeight: oChopperH
	,fSpeed: 0.1	// Chopper's accelerate
	,fUp: 0.01      // accelerate to go up
	,fHP: 1			// HP
	,nLoad: 0		// currently loaded volume/weight
	,nWater: 120	// currently loaded gallon of water
	,bShooting: false
}

// Global variable to keep game status
var oGame = {
	nFrame : 0		// current frame number of game loop
	,nStartTime: 0	// moment when level started
	,nStatus : enGameStatus.nInit	// current game status
	,imgFire : new Image	// images of game
	,imgBG : new Image
	,imgWater : new Image
	,imgAnimal : []
	,imgAnimalFace : []
	,bBGready : false
	,bFireReady : false
	,bChopperReady : false
	,bAnimalReady : true
	,nSaved : 0		// number of saved animals
	,nFireNum : 5	// number of fire in current level
	,nAnimalNum : 5	// total number of animals in current level
	,nLevel : 0		// current level
	,nTotalScore : 0
	,nScore : 0		// score of current level
}

// animal and fire object array
var arrAnimals = [];
var arrFires = [];


// Global variable for game sound and audio
var audGame = { };


// Game images onload check
oGame.imgBG.onload = function () {
    oGame.bBGready = true;
};

oGame.imgFire.onload = function () {
    oGame.bFireReady = true;
};


oChopper.img.onload = function () {
    oGame.bChopperReady = true;
};






/********************************************************************
 *
 *		function gameloop
 *			main iteration of this game
 *
 *********************************************************************/
function gameloop()
{
	var canvas = document.getElementById("game-canvas");
	var ctx = canvas.getContext('2d');
	var canvasBG = document.getElementById("game-background-canvas");
	var ctxBG = canvasBG.getContext('2d');
	var canvasMenu = document.getElementById("game-menu");
	var ctxMenu = canvasMenu.getContext('2d');
	
	
	// when all animals were saved, goes to level clear status
	if(oGame.nSaved >= oGame.nAnimalNum)
	{
		oGame.nStatus = enGameStatus.nLevelClear;
		oGame.nFrame = 0;
		oGame.nSaved = 0;
	}
	
	switch(oGame.nStatus)
	{
		// When game is in initializing status
		case enGameStatus.nInit:
			break;
		// When game is ready to play (show play now button on the screen)
		case enGameStatus.nReady:
			break;
		// When game is started
		case enGameStatus.nPlaying:
			if((Date.now() - oGame.nStartTime) >= 120000  )
			{
				oGame.nStatus = enGameStatus.nTimeOver;
				oGame.nFrame = 0;
				break;
			}
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			keyCheck();
			drawChopper(canvas, ctx);
			drawBG(canvasBG, ctxBG);
			drawAnimals(canvas, ctx);
			drawFire(canvas, ctx);
			drawMenu(canvasMenu, ctxMenu);
			oGame.nFrame++;
			break;
		// When chopper exploded
		case enGameStatus.nBoom:
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			
			drawAnimals(canvas, ctx);
			drawFire(canvas, ctx);
			drawChopper(canvas, ctx);
			oGame.nFrame++;
			if(oGame.nFrame > 120)
			{
				oGame.nStatus = enGameStatus.nGameOver;
				oGame.nFrame = 0;
			}
			break;
		// When time is over
		case enGameStatus.nTimeOver:
			if(oGame.nFrame == 0)
			{
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				drawAnimals(canvas, ctx);
				drawFire(canvas, ctx);
				drawChopper(canvas, ctx);
				ctxMenu.font="50px Verdana";
				ctxMenu.fillStyle = "#FF0000"; //red
				ctxMenu.fillText("Time Over", 400, 200);
			}
			else if(oGame.nFrame > 160)
			{
				oGame.nStatus = enGameStatus.nGameOver;
				oGame.nFrame = 0;
				break;
			}
			oGame.nFrame++;
			break;
		// When game is over
		case enGameStatus.nGameOver:
			if( oGame.nFrame == 0 )
				drawGameOver(canvasMenu, ctxMenu);
			oGame.nFrame++;
			break;
		// When user clear the level
		case enGameStatus.nLevelClear:
			if( oGame.nFrame == 0 )
			{
				var nNow = Date.now();
				var nGap = 120 - (nNow - oGame.nStartTime)/1000;
				oGame.nScore += Math.round(oChopper.fHP*50)*10 + Math.round(nGap)*10 + oGame.nLevel*20;
				audGame.score.play();
			}
			if(oGame.nFrame*10 <= oGame.nScore)
			{
				drawLevelClear(canvasMenu, ctxMenu);
			}
			else
			{
				audGame.score.pause();
				audGame.score.currentTime = 0;
				oGame.nTotalScore += oGame.nScore;
				oGame.nStatus = enGameStatus.nReady;
				setTimeout(toNextLevel, 3000);
			}
			oGame.nFrame++;
			break;
		default:
			break;
	}
}







/********************************************************************
 *
 *		Game init functions
 *
 *
 *
 *
 *
 *********************************************************************/
 
// init function when the DOM is ready
$(function(){	
	initObjects();
	//register key down event handler
	window.addEventListener( "keydown", keyPress, false );
	window.addEventListener( "keyup", keyUp, false )

	$(document).onkeydown = keyPress();
	$(document).onkeyup = keyUp();
//	$(document).keydown(keyPress(event));
//	$(document).keyup(keyUp(event));

	$('#menu-play').click(playNow);
	
	startGame();
});


// init game data to reset game or start game
function initData(){
	// initialize chopper
	oChopper.nDirection = enDirection.nRight;
	oChopper.nMotion = enMotion.nStaying;
	oChopper.nTop = 395;
	oChopper.nLeft = 0;
	oChopper.nFrame = 0;
	oChopper.bLeft = false;
	oChopper.bRight = false;
	oChopper.bUp = false;
	oChopper.fUp = 0.01;
	//oChopper.fHP = 1;
	oChopper.nLoad =  0;
	oChopper.nWater = 120;
	oChopper.bShooting = false;
	
	// initialize game state variables
	oGame.nFrame = 0;
	oGame.nStatus = enGameStatus.nInit;
	oGame.nSaved =  0;
	oGame.nScore = 0;
	
	// initialize number of animals and fires
	oGame.nFireNum = 5 + Math.floor(3/2*oGame.nLevel);
	oGame.nFireNum = (oGame.nFireNum > 14) ? 14 : oGame.nFireNum;
	oGame.nAnimalNum =  5 + Math.floor(oGame.nLevel*7/2);
	oGame.nAnimalNum = (oGame.nAnimalNum > 40) ? 40 : oGame.nAnimalNum;
	
	// randomly generate fires and animals
	initFire();
	initAnimals();
	
	
}


// when user click play now button on canvas
function playNow(){
	if(oGame.nStatus == enGameStatus.nInit)
	{
		$('#menu-scene').addClass('hide');
		oGame.nStatus = enGameStatus.nPlaying;
		oGame.nStartTime = Date.now();
	}
}

// check all the images loaded before start play
function startGame(){
	if(oGame.bBGready)
	{
		var bgCanvas = document.getElementById("game-background-canvas");
		var gbCtx = bgCanvas.getContext('2d');
		gbCtx.drawImage(oGame.imgBG, 0 ,0);
	}
	if(oGame.bBGready && oGame.bFireReady && oGame.bAnimalReady && oGame.bChopperReady)
	{
		initSound();
		// start main game loop
		setInterval(gameloop, 40);
	}
	else
	{
		setTimeout(startGame, 200);
	}
}

// initialize game objects
// load images
function initObjects(){
	oChopper.img.src = "img/Chopper.png";
	oChopper.imgBoom.src = "img/boom.png";
	oGame.imgBG.src = "img/game_bg_wide.jpg";
	oGame.imgFire.src = "img/fire02.png";
	oGame.imgWater.src = "img/waterfall.png";
	oGame.imgAnimal[enAnimalType.nElephant] = new Image();
	oGame.imgAnimal[enAnimalType.nElephant].src = "img/elephant.png";
	oGame.imgAnimal[enAnimalType.nMoose] = new Image();
	oGame.imgAnimal[enAnimalType.nMoose].src = "img/Moose2.png";
	oGame.imgAnimal[enAnimalType.nSheep] = new Image();
	oGame.imgAnimal[enAnimalType.nSheep].src = "img/sheep2.png";
	oGame.imgAnimal[enAnimalType.nRabbit] = new Image();
	oGame.imgAnimal[enAnimalType.nRabbit].src = "img/rabbit2.png";
	oGame.imgAnimal[enAnimalType.nChicken] = new Image();
	oGame.imgAnimal[enAnimalType.nChicken].src = "img/chicken2.png";
	oGame.imgAnimal[enAnimalType.nLion] = new Image();
	oGame.imgAnimal[enAnimalType.nLion].src = "img/lion2.png";
	
	oGame.imgAnimalFace[enAnimalType.nElephant] = new Image();
	oGame.imgAnimalFace[enAnimalType.nElephant].src = "img/elephant_face.png";
	oGame.imgAnimalFace[enAnimalType.nMoose] = new Image();
	oGame.imgAnimalFace[enAnimalType.nMoose].src = "img/moose_face.png";
	oGame.imgAnimalFace[enAnimalType.nSheep] = new Image();
	oGame.imgAnimalFace[enAnimalType.nSheep].src = "img/sheep_face.png";
	oGame.imgAnimalFace[enAnimalType.nRabbit] = new Image();
	oGame.imgAnimalFace[enAnimalType.nRabbit].src = "img/rabbit_face.png";
	oGame.imgAnimalFace[enAnimalType.nChicken] = new Image();
	oGame.imgAnimalFace[enAnimalType.nChicken].src = "img/chicken_face.png";
	oGame.imgAnimalFace[enAnimalType.nLion] = new Image();
	oGame.imgAnimalFace[enAnimalType.nLion].src = "img/lion_face.png";

	initFire();	
	initAnimals();
}

// Initialize fire objects. set its position and size on game map
function initFire(){
	var nCnt;
	// fire objects
	var oFire = {
		nLeft : nMapStart
		,nLength : nFireW*1.5
		,fSize : 1
	}
	
	// first fire position and size is fixed. just in front of heliport.
	arrFires[0] = oFire;
	
	// calculate available range for fire.
	// fixed value but for more game maps in the future
	var nAvailable = nMapWidth - (nLakeEnd-nLakeStart + nMapStart) - 3*(nFireW);
	
	// generate fire randomly
	for(nCnt=1; nCnt < oGame.nFireNum ; nCnt++){
		// fire objects
		var oFire = {
			nLeft : 0
			,nLength : 0
			,fSize : 1
		}
		
		// set fire start position randomly
		oFire.nLeft = nMapStart + Math.floor(Math.random()* nAvailable);
		// set fire length
		if(oFire.nLeft > (nLakeStart - (nFireW)))
		{
			oFire.nLeft += (nLakeEnd-nLakeStart+nFireW);
		}
		oFire.nLength = nFireW +  (Math.floor(Math.random() * 4) / 2) * nFireW;
		
		
		// check any duplicated fire exists
		var nCount = 0;
		var bDuplicated = false;
		for( nCount = 0 ; nCount < nCnt ; nCount++)
		{
			if( detectDuplicate(oFire.nLeft, oFire.nLeft+oFire.nLength, arrFires[nCount].nLeft, arrFires[nCount].nLeft+arrFires[nCount].nLength) )
			{
				bDuplicated = true;
				break;
			}
		}
		if(bDuplicated == true)
		{
			nCnt--;
			continue;
		}
		if( (oFire.nLeft + oFire.nLength) > nLakeStart && oFire.nLeft < nLakeStart )
		{
			oFire.nLength = nLakeStart - oFire.nLeft;
		}
		
		arrFires[nCnt] = oFire;
	}
}

// if not duplicated, return false
// duplicated return true
function detectDuplicate(nLeft1, nRight1, nLeft2, nRight2)
{
	if( (nRight1 < nLeft2) || (nRight2 < nLeft1) )
	{
		return false;
	}
	return true;
}

// initialize animal objects, set its position and direction
// initFire function should be called prior than this function to avoid duplicated position
function initAnimals(){
	var nCnt = 0;
	
	var canvas = document.getElementById("game-canvas");
	var animalCharicter = [];
	
	arrAnimals = [];
	
	// characteristics of each animal
	animalCharicter[enAnimalType.nElephant] = { nTop : 425, nWidth: 50, nHeight: 40, nWeight: 7, nVolume: 5, fSpeed : 1.3 };
	animalCharicter[enAnimalType.nMoose] = { nTop : 430, nWidth: 45, nHeight: 35, nWeight: 4, nVolume: 3, fSpeed : 3.5 };
	animalCharicter[enAnimalType.nSheep] = { nTop : 440, nWidth: 32, nHeight: 25, nWeight: 3, nVolume: 2, fSpeed : 1.7 };
	animalCharicter[enAnimalType.nRabbit] = { nTop : 440, nWidth: 25, nHeight: 25, nWeight: 2, nVolume: 1, fSpeed : 3.1 };
	animalCharicter[enAnimalType.nChicken] = { nTop : 445, nWidth: 25, nHeight: 20, nWeight: 1, nVolume: 1, fSpeed : 1.0 };
	animalCharicter[enAnimalType.nLion] = { nTop : 445, nWidth: 40, nHeight: 30, nWeight: 4, nVolume: 3, fSpeed : 2.6 };
	
	for (nCnt = 0 ; nCnt < oGame.nAnimalNum ; nCnt++){
	
		// animal objects
		var oAnimal = {
			nDirection: enDirection.nRight
			,nType: enAnimalType.nElephant
			,nTop: 425   // y coordinate (fixed value for each type of animal)
			,nLeft: 0    // x coordinate
			,nWidth: 50
			,nHeight: 40
			,fHP: 1  // health point of animal object. not implemented yet
			,fSpeed: 1
			,nWeight: 2 // weight of animal object. it affect speed of helicopter. not implemented yet.
			,nVolume: 1
			,nStatus: enAnimalStatus.nLand
		}
		
		var nType, nPosition, nDirection;
		
		nType = Math.floor(Math.random()*6);
		
		oAnimal.nTop = animalCharicter[nType].nTop;
		oAnimal.nWidth = animalCharicter[nType].nWidth;
		oAnimal.nHeight = animalCharicter[nType].nHeight;
		oAnimal.nWeight = animalCharicter[nType].nWeight;
		oAnimal.nVolume = animalCharicter[nType].nVolume;
		oAnimal.fSpeed = animalCharicter[nType].fSpeed;
		
		if(nType > enAnimalType.nLion )
		{
			do{
				nPosition = nMapStart + Math.round( Math.random() * (nMapWidth-nMapStart-oAnimal.nWidth)   );
			}while( isOnFire(nPosition, oAnimal.nWidth) || isOnLake(nPosition, oAnimal.nWidth ) )

		}
		else
		{
			do{
				nPosition = nMapStart + Math.round( Math.random() * (nMapWidth-nMapStart-oAnimal.nWidth)   );
			}while( isOnFire(nPosition, oAnimal.nWidth) )

		}
		
		
		if(Math.random() > 0.5)
			nDirection = enDirection.nLeft;
		else
			nDirection = enDirection.nRight;
			
		oAnimal.nType = nType;
		oAnimal.nLeft = nPosition;
		oAnimal.nDirection = nDirection;
		
		
		arrAnimals[nCnt] = oAnimal;
	}
}


// check a object is over/on/in any fire or not.
// nCoordX: X coordinate of the object, nWidth: width of the object
// nCoordY: Y coordinate of the object, nHeight: height of the object
// return true: in, over or on the fire, return false: not in nor on the fire
function isOverFire(nCoordX, nWidth, nCoordY, nHeight){
	var nCnt, bDuplicated=false;
	
	for (nCnt=0 ; nCnt < arrFires.length ; nCnt++){
		if(arrFires[nCnt].fSize <= 0)
		{
			continue;
		}
		if( detectDuplicate(nCoordX, nCoordX+nWidth, arrFires[nCnt].nLeft, arrFires[nCnt].nLeft + arrFires[nCnt].nLength) )
		{
			if( (nCoordY+nHeight) >  (480-nFireH*arrFires[nCnt].fSize*0.8) ){
				bDuplicated = true;
				break;
			}
		}
	}
	
	if(bDuplicated == false)
	{
		return false;
	}
	else{
		return true;
	}
}


// Check the object is on the lake or not
// nCoordX: X coordinate of the object, nWidth: width of the object
// return false -  not on the lake, return true -  on the lake
function isOnLake(nCoordX, nWidth){	
	var bDuplicated=false;

	if( detectDuplicate(nCoordX, nCoordX+nWidth, nLakeStart, nLakeEnd) )
	{
		bDuplicated = true;
	}
	
	return bDuplicated;
}


// check the object is on the fire or not
// nCoordX: X coordinate of the object, nWidth: width of the object
// return false -  not in the fire, return true -  collide with fire
function isOnFire(nCoordX, nWidth){	
	var nCnt, bDuplicated=false;
	
	for (nCnt=0 ; nCnt < arrFires.length ; nCnt++){
		if(arrFires[nCnt].fSize <= 0)
		{
			continue;
		}
		if( detectDuplicate(nCoordX, nCoordX+nWidth, arrFires[nCnt].nLeft, arrFires[nCnt].nLeft + arrFires[nCnt].nLength) )
		{
			bDuplicated = true;
			break;
		}
	}
	return bDuplicated;
}



/********************************************************************
 *
 *		Audio and Sound functions
 *
 *
 *
 *
 *
 *********************************************************************/
 
 
// initialize game sound effects and bg music
// load all music/sound resources and if it needs, bind loopback play
function initSound(){
	audGame.bgDrum = [];
	audGame.bgDrum[0] = new Audio('./audio/funky.mp3');
	audGame.bgDrum[1] = new Audio('./audio/Percussion.mp3');
	audGame.bgDrum[2] = new Audio('./audio/djumbe.mp3');
	audGame.playDrum = audGame.bgDrum[0];
	
	audGame.chopper = new Audio('./audio/chopper.mp3');
	
	audGame.fire = new Audio('./audio/fire.mp3');
	
	
	audGame.birds = [];
	audGame.birds[0] = new Audio('./audio/birds1.mp3');
	audGame.birds[1] = new Audio('./audio/birds2.mp3');
	audGame.birds[2] = new Audio('./audio/birds3.mp3');
	audGame.birdsPlay = audGame.birds[0];
	
	
	audGame.effects = [];
	audGame.effects[0] = new Audio('./audio/cow01_effect.mp3');
	audGame.effects[1] = new Audio('./audio/cow02_effect.mp3');
	audGame.effects[2] = new Audio('./audio/elephant01_effect.mp3');
	audGame.effects[3] = new Audio('./audio/elephant02_effect.mp3');
	audGame.effects[4] = new Audio('./audio/laughing_bird_effect.mp3');
	audGame.effects[5] = new Audio('./audio/lion01_effect.mp3');
	audGame.effects[6] = new Audio('./audio/lion02_effect.mp3');
	audGame.effects[7] = new Audio('./audio/lion03_effect.mp3');
	audGame.effects[8] = new Audio('./audio/monkey_effect.mp3');
	audGame.effects[9] = new Audio('./audio/monkey_effect2.mp3');
	audGame.effectPlay = audGame.effects[2];
	
	audGame.boom = new Audio('./audio/boom.mp3');
	
	audGame.boom.loop = false;
	
	audGame.chopper.volume = 1;
	//audGame.fire.volume = 0.1;
	
	audGame.honk = new Audio('./audio/horn.mp3');
	audGame.score = new Audio('./audio/score.mp3');
		
	$(audGame.chopper).bind('ended', function()  {
    	audGame.chopper.play();
	});
	
	$(audGame.score).bind('ended', function()  {
		audGame.score.play();
	});

	
	audGame.water = new Audio('./audio/waterfall.mp3');
	
	
	playDrum();
	audGame.chopper.play();
	playBirds();	
	playEffect();
	playFire();
}

// play background sound
// handdrum, djumbe, and puccusion sound randomly relaying
function playDrum(){
	var fRand = Math.random() * (audGame.bgDrum.length);
	var nRand = Math.floor(fRand);
	
	audGame.playDrum = audGame.bgDrum[nRand];
	audGame.playDrum.play();
	
	$(audGame.playDrum).unbind('ended');
	$(audGame.playDrum).bind('ended', function()  {
		playDrum();
	});
}

// play background sound effect. various bird's singings
function playBirds(){
	var fRand = Math.random() * (audGame.birds.length);
	var nRand = Math.floor(fRand);
	
	audGame.birdsPlay = audGame.birds[nRand];
	audGame.birdsPlay.play();
	audGame.birdsPlay.volume = 0.75;
	
	$(audGame.birdsPlay).unbind('ended');
	$(audGame.birdsPlay).bind('ended', function()  {
		playBirds();
	});
}

// play background sound effect. various animal's sound
function playEffect(){
	var fRand = Math.random() * (audGame.effects.length);
	var nRand = Math.floor(fRand);
	
	audGame.effectPlay = audGame.effects[nRand];
	audGame.effectPlay.play();
	
	$(audGame.effectPlay).unbind('ended');
	$(audGame.effectPlay).bind('ended', function()  {
		var fRand = Math.random()*8000;
		setTimeout(playEffect, fRand);
	});
}

// play fire sound effect
function playFire(){
	$(audGame.fire).unbind('ended')
	audGame.fire.play();
	$(audGame.fire).bind('ended', function()  {
		playFire();
		//var fRand = Math.random()*20000;
		//setTimeout(playFire, fRand);
	});
}


/********************************************************************
 *
 *		Key stroke event handling functions
 *
 *      And recognizing user input status function
 *
 *
 *
 *********************************************************************/
 
// keyDown event handler
function keyPress(){
	switch(event.which){
		case 32: // space bar key
			
			break;
		case 37: // left key
			oChopper.bLeft = true;
			//moveLeft();
			break;
		case 38: // up key
			oChopper.bUp = true;
			//goUp();
			break;
		case 39: // right key
			oChopper.bRight = true;
			//moveRight();
			break;
		case 40: // down key
			oChopper.bDown = true;
			//goDown();
			break;
		default:
			return;
	}
}

// Keyup event handler
function keyUp(){
	switch(event.which){
		case 16:
			honkHorn();
			break;
		case 32: // space bar key
			waterShot();
			break;
		case 37: // left key
			oChopper.bLeft = false;
			break;
		case 38: // up key
			oChopper.bUp = false;
			break;
		case 39: // right key
			oChopper.bRight = false;
			break;
		case 40: // down key
			oChopper.bDown = false;
			break;
		default:
			break;
	}
}

// check current user input status
// to recognize keep pressing, check keyup event
// and to recognize diagonal movement status...
function keyCheck(){
	var canvas = document.getElementById("game-canvas");
	var nHorizontal = 20;
	var nVertical = 10;
	var nWidth = oGame.imgBG.width;
	var nHeight = canvas.height;
	
	var nMaxLeft = nWidth - oChopper.nWidth;
	var nMaxTop = nHeight-10 - oChopper.nHeight;
	if(oChopper.bRight)
	{
		if(oChopper.nMotion != enMotion.nTurning){
			if(oChopper.nDirection == enDirection.nLeft){
				oChopper.nDirection = enDirection.nRight;
				oChopper.nMotion = enMotion.nTurning;
				oChopper.fSpeed = 0.1;
				oChopper.nFrame = 0;
			}
			else if(oChopper.nMotion == enMotion.nStaying){
				oChopper.nMotion = enMotion.nMoving;
				//oChopper.fSpeed = 0.1;
				oChopper.nFrame = 0;
			}
			else{
				oChopper.nLeft += (oChopper.fSpeed);
				oChopper.fSpeed = (oChopper.fSpeed + 0.05) * 1.15;
				//oChopper.fSpeed *= 1.25;
				if(oChopper.nLeft > nMaxLeft)
					oChopper.nLeft = nMaxLeft;
			}
		}
	}
	else if(oChopper.bLeft)
	{
		if(oChopper.nMotion != enMotion.nTurning){
			if(oChopper.nDirection == enDirection.nRight){
				oChopper.nDirection = enDirection.nLeft;
				oChopper.nMotion = enMotion.nTurning;
				oChopper.fSpeed = 0.1;
				oChopper.nFrame = 0;
			}
			else if(oChopper.nMotion == enMotion.nStaying){
				oChopper.nMotion = enMotion.nMoving;
				//oChopper.fSpeed = 0.1;
				oChopper.nFrame = 0;
			}
			else
			{
				oChopper.nLeft -= (oChopper.fSpeed);
				oChopper.fSpeed = (oChopper.fSpeed + 0.05) * 1.15;
				//oChopper.fSpeed *= 1.25;
				if(oChopper.nLeft < 0)
					oChopper.nLeft = 0;
			}
		}
	}
	else
	{
		if(oChopper.nMotion == enMotion.nMoving){
			oChopper.nMotion = enMotion.nStaying;
			oChopper.nFrame = 0;
		}
		oChopper.fSpeed *= 0.6;
	}
	
	if(oChopper.fSpeed > nHorizontal)
		oChopper.fSpeed = nHorizontal;
	else if (oChopper.fSpeed < 0.1)
		oChopper.fSpeed = 0.1;
	
	if(oChopper.bUp)
	{
		oChopper.nTop -= oChopper.fUp;
		oChopper.fUp = (oChopper.fUp + 0.02) * 1.11;
		//oChopper.fUp *= 1.25;
		if(oChopper.fSpeed > 15)
		{
			oChopper.fUp *= 1.6;
		}
		else if(oChopper.fSpeed > 10)
		{
			oChopper.fUp *= 1.4;
		}
		else if(oChopper.fSpeed > 5)
		{
			oChopper.fUp *= 1.1;
		}
		if(oChopper.nTop < 0){
			oChopper.nTop = 0;
		}
		
		if(oChopper.fUp > (nVertical*2.5))
			oChopper.fUp = (nVertical*2.5);
	}
	else if (oChopper.bDown)
	{
		oChopper.nTop += (nVertical);
		if(oChopper.nTop > nMaxTop){
			oChopper.nTop = nMaxTop;
		}
		oChopper.fUp = 0.01;
	}
	else{
		oChopper.fUp = 0.01;
	}
}

/*
function moveLeft(){
}

function moveRight(){
}

function goUp(){
	var curPos = oChopper.nTop;
	curPos -= 4;
	if(curPos < 0)
		curPos = 0;
	oChopper.nTop = curPos;
}

function goDown(){
	var curPos = oChopper.nTop;
	curPos += 4;
	if(curPos > 350)
		curPos = 350;
	oChopper.nTop = curPos;
}
*/

// when user press shift key to honk a horn
function honkHorn(){
	audGame.honk.pause();
	audGame.honk.currentTime = 0;
	audGame.honk.play();
	
	setTimeout(changeDirection, 500, oChopper.nDirection, oChopper.nLeft );
}

// when helicopter honk, animals in front of the helicopter, will change their direction
function changeDirection(nDirection, nLeft){
	// if honk to right side, animals on right side change direction to right side
	if(nDirection == enDirection.nRight)
	{
		for(var nCnt=0 ; nCnt < arrAnimals.length ; nCnt++)
		{
			if((arrAnimals[nCnt].nLeft > nLeft + oChopper.nWidth/2) && (arrAnimals[nCnt].nLeft < nLeft + oChopper.nWidth/2 + 350) )
			{
				arrAnimals[nCnt].nDirection = enDirection.nRight;
			}
		}
	}
	else
	{
		for(var nCnt=0 ; nCnt < arrAnimals.length ; nCnt++)
		{
			if( (arrAnimals[nCnt].nLeft < nLeft) && (arrAnimals[nCnt].nLeft > nLeft -350) )
			{
				arrAnimals[nCnt].nDirection = enDirection.nLeft;
			}
		}	
	}
}

// when user press space bar, chopper pour water
function waterShot(){
	if(oGame.nStatus != enGameStatus.nPlaying)
		return;
	if(oChopper.nWater > 0 &&  (oChopper.nWater%20) == 0)
	{
		oChopper.bShooting = true;
		audGame.water.pause();
		audGame.water.currentTime = 0;
		audGame.water.play();
		oChopper.nWater -= 1;
		setTimeout(shootingWater, 100);
	}
	return;
}

function shootingWater(nNum) {
	if( (oChopper.nWater%20) == 0)
	{
		oChopper.bShooting = false;
		audGame.water.pause();
		audGame.water.currentTime=0;
		//setTimeout(function(){ }, 100);
	}
	else
	{
		oChopper.nWater -= 1;
		setTimeout(shootingWater, 100);
	}
	return;
}




/********************************************************************
 *
 *		image rendering functions
 *
 *
 *
 *
 *
 *********************************************************************/

// draw game ui screen
function drawMenu(canvas, ctx){
	var nNow = Date.now();
	var nGap = nNow - oGame.nStartTime;
	var fSec;
	var nMin;
	
	nGap = 120 - Math.round(nGap / 1000);
	fSec = nGap % 60;
	nMin = Math.floor( Math.floor(nGap/60));
	
	ctx.clearRect(0,0, canvas.width, canvas.height);

	
	// Display Time
	ctx.font="25px Arial";
	ctx.fillStyle="#1111AA";
	if(fSec < 10)
		ctx.fillText("Level " + (oGame.nLevel+1) + "     Time: " + nMin + ":0" + fSec + "     Saved: " + oGame.nSaved + " / " + oGame.nAnimalNum + "     Score: " + oGame.nScore  ,20, 30);
	else
		ctx.fillText("Level " + (oGame.nLevel+1) + "     Time: " + nMin + ":" + fSec  + "     Saved: " + oGame.nSaved + " / " + oGame.nAnimalNum + "     Score: " + oGame.nScore,20, 30);
	
	
	
	
	// Display  HP of chopper
	ctx.fillStyle="red";
	ctx.font="25px Verdana";
	var nHP = Math.round(oChopper.fHP * 100);
	ctx.fillText("HP",20, 70);
	
	// HP bar background
	ctx.fillStyle = "#3370d4"; //blue
	ctx.strokeRect(90,45,500,28);
	
	// HP bar
	ctx.fillStyle = "rgba(255, 20, 20,0.7)";
	ctx.beginPath();
	ctx.rect(90,45,500*oChopper.fHP,28);
	ctx.closePath();
	ctx.fill();	
	
	// available seats in chopper 
	ctx.fillStyle="111111";
	ctx.fillText("Seat", 20, 110);
	// seat bar background color
	ctx.fillStyle = "#111177"; //blue
	ctx.strokeRect(90,85,500,28);
	
	// seat bar
	var gradient=ctx.createLinearGradient(90,0,510,0);
	gradient.addColorStop("0","rgba(255, 20, 255,0.7)");
	gradient.addColorStop("1","rgba(255, 20, 70,0.7)");
	ctx.fillStyle=gradient;
	ctx.beginPath();
	ctx.rect(90,85,50*(oChopper.nLoad),28);
	ctx.closePath();
	ctx.fill();
	
	var nCurPos = 0;
	for(nCnt=0 ; nCnt < arrAnimals.length ; nCnt++)
	{
		if(arrAnimals[nCnt].nStatus == enAnimalStatus.nLoad)
		{
			var nPosX = 90 + nCurPos * 50;
			nPosX += arrAnimals[nCnt].nVolume * 25 - 15;
			nCurPos += arrAnimals[nCnt].nVolume;
			var imgFace;
			ctx.drawImage(oGame.imgAnimalFace[arrAnimals[nCnt].nType] , nPosX,86);
		}
	}
	
	
		
	// water tank in chopper
	ctx.font="30px Verdana";
	ctx.fillStyle = "#2230F4"; //blue
	ctx.fillText("Water", 630, 90);
	ctx.fillStyle = "#00FF00"; //green
	ctx.beginPath();
	ctx.arc(775, 80, 35, 0, Math.PI*2, true); 
	ctx.stroke();
	//ctx.closePath();
	//ctx.fill();
	ctx.fillStyle = "rgba(20, 20, 255,0.7)";
	ctx.beginPath();
	ctx.moveTo(775,80);
	ctx.lineTo(810,80);
	ctx.arc(775, 80, 35, 0, Math.PI*(oChopper.nWater/60), false); 
	ctx.closePath();
	ctx.fill();
	


	return;
}
 
// draw background image on the canvas
// if chopper does not move, do not need to redraw bg.
function drawBG(canvas, ctx){
	var posX = (canvas.width-oChopper.nWidth)/2;
	
	if( (oChopper.nLeft > posX) && (oChopper.nLeft < (oGame.imgBG.width-(posX+oChopper.nWidth)) ) ){
		posX = oChopper.nLeft- posX;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		ctx.drawImage(oGame.imgBG, posX,0, canvas.width,canvas.height, 0,0, canvas.width,canvas.height);
	}
	return;
}

// draw chopper image
function drawChopper(canvas, ctx){
	var imgX = 0;
	var imgY = 0;
	var maxFrm = 0;
	var posX = (canvas.width-oChopper.nWidth)/2;
	
	switch(oChopper.nMotion){
		case enMotion.nStaying:
			maxFrm = 3;
			imgY = oChopper.nHeight*2+1;
			break;
		case enMotion.nMoving:
			maxFrm = 3;
			imgY = oChopper.nHeight+1;
			break;
		case enMotion.nTurning:
			maxFrm = 9;
			imgY = 1;
			break;
	}
	
	if(oChopper.nFrame >= maxFrm){
		oChopper.nFrame = 0;
		// When turning is done, change to moving status
		if(oChopper.nMotion == enMotion.nTurning)
		{
			oChopper.nMotion = enMotion.nMoving;
			oChopper.fSpeed = 0.5;
			imgY = oChopper.nHeight;
		}
	}
	
	// find x postion in sprite image 
	if( oChopper.nMotion == enMotion.nTurning){
		if(oChopper.nDirection == enDirection.nLeft){
			imgX = ( oChopper.nWidth * (8 - oChopper.nFrame));
		}
		else
		{
			imgX = oChopper.nWidth * oChopper.nFrame;
		}
	}
	else if(oChopper.nDirection == enDirection.nRight)
	{
		imgX = (oChopper.nWidth * (3 + oChopper.nFrame));
	}
	else
	{
		imgX = oChopper.nWidth * oChopper.nFrame;
	}

	// Determine chopper's relative position on the canvas.
	if( oChopper.nLeft < posX )
	{
		posX = oChopper.nLeft;
	}
	else if( oChopper.nLeft < (oGame.imgBG.width-(posX+oChopper.nWidth)) ){
		posX = posX;
	}
	else{
		posX = oChopper.nLeft - (oGame.imgBG.width - canvas.width);
	}
	
	// Check chopper is over the fire.
	// if yes, reduce its health point and turn on fire sound.
	if(oChopper.nDirection == enDirection.nLeft){
		if(isOverFire(oChopper.nLeft+36, oChopper.nWidth-45, oChopper.nTop, oChopper.nHeight))
		{
			oChopper.fHP -= 0.007;
			audGame.chopper.pause();
			audGame.chopper.time=0;
			if(audGame.fire.time == 0)
				playFire(); //audGame.fire.play();
		}
		else
		{
			if(audGame.chopper.time == 0)
				audGame.chopper.play();
			audGame.fire.pause();
			audGame.fire.time = 0;
		}
	}
	else
	{
		if(isOverFire(oChopper.nLeft+10, oChopper.nWidth-45, oChopper.nTop, oChopper.nHeight))
		{
			oChopper.fHP -= 0.007;
			audGame.chopper.pause();
			audGame.chopper.time=0;
			if(audGame.fire.time == 0)
				playFire(); //audGame.fire.play();
		}
		else
		{
			if(audGame.chopper.time == 0)
				audGame.chopper.play();
			audGame.fire.pause();
			audGame.fire.time = 0;
		}
	}
	
	// if chopper is close to the land
	if(oChopper.nTop > 382)
	{
		var nCnt;
		
		// on chopper landing place
		if(oChopper.nLeft < 40)
		{
			// if there're any loaded animal, landing them
			for(nCnt=0 ; nCnt < arrAnimals.length ; nCnt++)
			{
				if(arrAnimals[nCnt].nStatus == enAnimalStatus.nLoad)
				{
					arrAnimals[nCnt].nStatus = enAnimalStatus.nLand;
					arrAnimals[nCnt].nDirection = enDirection.nLeft;
					arrAnimals[nCnt].nLeft = 10 +( Math.random()*40) ;
					oChopper.nLoad -= arrAnimals[nCnt].nVolume;
					oGame.nScore += 50;
				}
			}
			// fill water tank
			oChopper.nWater = 120;
		}
		else
		{
			// if there're any animal near chopper, load them
			for(nCnt=0 ; nCnt < arrAnimals.length ; nCnt++)
			{
				if( oChopper.nLeft+30 < arrAnimals[nCnt].nLeft && arrAnimals[nCnt].nLeft  < oChopper.nLeft + 70)
				{
					//cannot overload
					if( (oChopper.nLoad + arrAnimals[nCnt].nVolume) <= 10 )
					{
						arrAnimals[nCnt].nStatus = enAnimalStatus.nLoad;
						arrAnimals[nCnt].nLeft = -100;
						oChopper.nLoad += arrAnimals[nCnt].nVolume;
						oGame.nScore += 20;
					}
				}
			}
		}
		
		// if chopper is over the lake, fill water tank
		if(oChopper.nLeft+(oChopper.nWidth*0.3) > nLakeStart && oChopper.nLeft < nLakeEnd-oChopper.nWidth/2)
			oChopper.nWater = 120;
	}
	
	// if chopper, shooting water, draw water image
	if(oChopper.bShooting == true)
	{
		var wimgW = 80; // width of the image
		var wimgH = 480; // height of the image

		var wposY = oChopper.nTop+oChopper.nHeight-5; // draw Y position on canvas
		var wposX = posX+oChopper.nWidth/2-wimgW/2; // draw X position on canvas

		
		var wimgX = wimgW * (oChopper.nFrame%3); // sprite image X position
		var wimgY = wimgH - (394+oChopper.nHeight - (wposY)); // sprite image Y position
		wimgH = (394+oChopper.nHeight - (wposY));
		
		ctx.drawImage(oGame.imgWater, wimgX, wimgY, wimgW, wimgH, wposX, wposY, wimgW, wimgH);
		
		//ctx.fillStyle = "#0000FF"; //blue
		//ctx.beginPath();
		//ctx.roundRect(posX+oChopper.nWidth/2-15,oChopper.nTop+oChopper.nHeight-5,30,394+oChopper.nHeight - (oChopper.nTop+oChopper.nHeight-5), 10);
		//ctx.closePath();
		//ctx.fill();		
	}
	
	// normal case
	if(oGame.nStatus != enGameStatus.nBoom)
	{
		ctx.drawImage(oChopper.img, imgX,imgY, oChopper.nWidth,oChopper.nHeight, posX,oChopper.nTop, oChopper.nWidth,oChopper.nHeight);
	}
	else // if its in explosion
	{	
		ctx.drawImage(oChopper.imgBoom, 0, 0, oChopper.imgBoom.width, oChopper.imgBoom.height, posX, oChopper.nTop, oChopper.nWidth+(oGame.nFrame)/3, oChopper.nHeight+(oGame.nFrame)/3);
	}
	
	
	// Check health point of chopper
	if(oChopper.fHP <= 0 && oChopper.nFrame != 0 )
	{
		// if health point reach to 0, explode it
		oChopper.fHP = 0;
		oGame.nStatus = enGameStatus.nBoom;
		audGame.boom.play();
		oGame.nFrame = 0;
		oChopper.nFrame = 0;
	}
	
	if(oGame.nStatus != enGameStatus.nBoom)
		oChopper.nFrame++;
	
	return;
}

// rounded edge rectangular function 
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x+r, y);
  this.arcTo(x+w, y,   x+w, y+h, r);
  this.arcTo(x+w, y+h, x,   y+h, r);
  this.arcTo(x,   y+h, x,   y,   r);
  this.arcTo(x,   y,   x+w, y,   r);
  this.closePath();
  return this;
}



// draw fire image
function drawFire(canvas, ctx){
	
	var nCnt = 0;
	var posX = (canvas.width-oChopper.nWidth)/2;
	var firePos = 0;
	for (nCnt = 0 ; nCnt < arrFires.length ; nCnt++)
	{
		var imgX = 0, imgY = 0;
		var firePos = arrFires[nCnt].nLeft;
		imgX = nFireW * (oGame.nFrame%4);
		imgY = nFireH * (Math.floor(oGame.nFrame/4) %4);
		
		if(arrFires[nCnt].fSize <= 0 )
		{
			continue;
		}
		
		
		// if chopper shooting water in the sky
		if(oChopper.bShooting == true)
		{
			// check that water shot is above this fire or not
			if (detectDuplicate(firePos-10, firePos+nFireW/2, oChopper.nLeft+oChopper.nWidth/2-15, oChopper.nLeft+oChopper.nWidth/2+30) )
			{
				if( arrFires[nCnt].nLength > nFireW)
				{
					firePos = arrFires[nCnt].nLeft += 2;
					arrFires[nCnt].nLength -= 2;
				}
				else
				{
					arrFires[nCnt].fSize -= 0.04;
					arrFires[nCnt].nLength -= (nFireW * 0.035);
					if(arrFires[nCnt].fSize <= 0)
					{
						firePos = arrFires[nCnt].nLeft = -400;
						arrFires[nCnt].nLength = 0;
						oGame.nScore += 100;
					}
				}
			}
			else if (detectDuplicate(firePos+ arrFires[nCnt].nLength - nFireW/2, firePos+ arrFires[nCnt].nLength+10, oChopper.nLeft+oChopper.nWidth/2-15, oChopper.nLeft+oChopper.nWidth/2+30) )
			{
				if( arrFires[nCnt].nLength > nFireW)
				{
					arrFires[nCnt].nLength -= 2;
				}
				else
				{
					arrFires[nCnt].fSize -= 0.04;
					arrFires[nCnt].nLength -= (nFireW * 0.035);
					if(arrFires[nCnt].fSize <= 0)
					{
						firePos = arrFires[nCnt].nLeft = -400;
						arrFires[nCnt].nLength = 0;
						oGame.nScore += 100;
					}
				}
			}
		}

		
		if( oChopper.nLeft < posX )
		{
			;
		}
		else if( (oChopper.nLeft > posX) &&( oChopper.nLeft < (oGame.imgBG.width-(posX+oChopper.nWidth)) ) ){
			firePos -= (oChopper.nLeft-posX);
		}
		else{
			firePos -= (nMapWidth - canvas.width);
		}
		if(arrFires[nCnt].fSize > 0.4 )
			ctx.drawImage(oGame.imgFire, imgX,imgY, nFireW,nFireH, firePos,(canvas.height-5-nFireH*arrFires[nCnt].fSize),   nFireW*arrFires[nCnt].fSize,   nFireH*arrFires[nCnt].fSize);
		else
			ctx.drawImage(oGame.imgFire, imgX,imgY, nFireW,nFireH, firePos,(canvas.height-5-nFireH*arrFires[nCnt].fSize-29),   nFireW*arrFires[nCnt].fSize+29,   nFireH*arrFires[nCnt].fSize+29);
		
		if(arrFires[nCnt].nLength > nFireW){
			var nMax = Math.floor( arrFires[nCnt].nLength / (nFireW/2) ) - 1;
			var nCount = 0;
			
			for( nCount = 0; nCount < nMax ; nCount++)
			{
				var extendFirePos = firePos + arrFires[nCnt].nLength - nFireW - (nFireW/2 * nCount);
				imgX = nFireW * ((oGame.nFrame+nCount)%4);
				imgY = nFireH * (Math.floor((oGame.nFrame+nCount)/4) %4);
				ctx.drawImage(oGame.imgFire, imgX,imgY, nFireW,nFireH, extendFirePos,(canvas.height-5-nFireH), nFireW,nFireH); 
			}
		}
	}
	return;
}

// draw animal images
function drawAnimals(canvas, ctx){
	var nCnt = 0;
	var posX = (canvas.width-oChopper.nWidth)/2;
	
	for (nCnt = 0 ; nCnt <arrAnimals.length ; nCnt++){
		var imgY = 0, nXpos;
		var imgX = arrAnimals[nCnt].nWidth * (Math.floor(oGame.nFrame/5) %6);
		
		if(arrAnimals[nCnt].nStatus == enAnimalStatus.nLand)
		{
			if(arrAnimals[nCnt].nDirection == enDirection.nLeft)
			{
				var nMapPos;
				
				arrAnimals[nCnt].nLeft = arrAnimals[nCnt].nLeft - arrAnimals[nCnt].fSpeed;
				
				// When animal reach to heliport
				if(arrAnimals[nCnt].nLeft <= -(arrAnimals[nCnt].nWidth/2) )
				{
					arrAnimals[nCnt].nStatus = enAnimalStatus.nSaved;
					oGame.nSaved++;
					oGame.nScore += 20;
				} // When animal meet fire
				else if( isOnFire(arrAnimals[nCnt].nLeft, arrAnimals[nCnt].nWidth) )
				{
					arrAnimals[nCnt].nDirection = enDirection.nRight;
					arrAnimals[nCnt].nLeft = arrAnimals[nCnt].nLeft + 2*arrAnimals[nCnt].fSpeed;
					imgY = arrAnimals[nCnt].nHeight;
				}
				
				// if animal type is smaller type cannot across lake
				if (arrAnimals[nCnt].nType > enAnimalType.nLion )
				{
					if(arrAnimals[nCnt].nLeft <= nLakeEnd && arrAnimals[nCnt].nLeft+arrAnimals[nCnt].fSpeed > nLakeEnd )
					{
						arrAnimals[nCnt].nDirection = enDirection.nRight;
						arrAnimals[nCnt].nLeft = arrAnimals[nCnt].nLeft + 2*arrAnimals[nCnt].fSpeed;
						imgY = arrAnimals[nCnt].nHeight;
					}
				}
			}
			else
			{
				imgY = arrAnimals[nCnt].nHeight;
				arrAnimals[nCnt].nLeft = arrAnimals[nCnt].nLeft + arrAnimals[nCnt].fSpeed;
				
				// when animal meet fire`
				if( isOnFire(arrAnimals[nCnt].nLeft, arrAnimals[nCnt].nWidth) )
				{
					arrAnimals[nCnt].nDirection = enDirection.nLeft;
					arrAnimals[nCnt].nLeft = arrAnimals[nCnt].nLeft - 2*arrAnimals[nCnt].fSpeed;
					imgY = 0;
				}
				else if ( arrAnimals[nCnt].nLeft + arrAnimals[nCnt].nWidth > nMapWidth ) // when animal reach to the end of map
				{
					arrAnimals[nCnt].nDirection = enDirection.nLeft;
					arrAnimals[nCnt].nLeft = arrAnimals[nCnt].nLeft - 2* arrAnimals[nCnt].fSpeed;
					imgY = 0;
				}
				
				// if animal type is smaller type cannot across lake
				if (arrAnimals[nCnt].nType > enAnimalType.nLion )
				{
					if(arrAnimals[nCnt].nLeft+arrAnimals[nCnt].nWidth >= nLakeStart && arrAnimals[nCnt].nLeft-arrAnimals[nCnt].fSpeed < nLakeStart)
					{
						arrAnimals[nCnt].nDirection = enDirection.nLeft;
						arrAnimals[nCnt].nLeft = arrAnimals[nCnt].nLeft - 2*arrAnimals[nCnt].fSpeed;
						imgY = arrAnimals[nCnt].nHeight;
					}
				}
			}
			
			nXpos = arrAnimals[nCnt].nLeft;
			if( oChopper.nLeft < posX )
			{
				;
			}
			else if( (oChopper.nLeft > posX) &&( oChopper.nLeft < (nMapWidth-(posX+oChopper.nWidth)) ) ){
				nXpos -= (oChopper.nLeft-posX);
			}
			else{
				nXpos -= (nMapWidth - canvas.width);
			}
			
			if( (arrAnimals[nCnt].nLeft > nLakeStart-(arrAnimals[nCnt].nWidth/6)) && (arrAnimals[nCnt].nLeft < (nLakeEnd - arrAnimals[nCnt].nWidth )) )
			{
				ctx.drawImage(oGame.imgAnimal[arrAnimals[nCnt].nType], imgX,imgY, arrAnimals[nCnt].nWidth,arrAnimals[nCnt].nHeight-10, nXpos,(canvas.height-(arrAnimals[nCnt].nHeight+10)), arrAnimals[nCnt].nWidth,arrAnimals[nCnt].nHeight-10);
			}
			else
			{
				ctx.drawImage(oGame.imgAnimal[arrAnimals[nCnt].nType], imgX,imgY, arrAnimals[nCnt].nWidth,arrAnimals[nCnt].nHeight, nXpos,(canvas.height-(arrAnimals[nCnt].nHeight+10)), arrAnimals[nCnt].nWidth,arrAnimals[nCnt].nHeight);
			}
		}
	}
	return;
}



// when game entered to gameover status.
function drawGameOver(canvasMenu, ctxMenu){
	//var canvasMenu = document.getElementById("game-menu");
	//var ctxMenu = canvasMenu.getContext('2d');
	
	// load the saved last score and save time from local storage
	var lastScore = localStorage.getItem("last-score");
	
	// check if there is no any saved record
	lastScoreObj = JSON.parse(lastScore);
	if (lastScoreObj == null)
	{
		// create an empty record if there is no any saved record
		lastScoreObj = {"savedTime": "no record", "score": 0};
	}	
	var lastScore = lastScoreObj.score;

	ctxMenu.clearRect(0, 0, canvasMenu.width, canvasMenu.height);
	ctxMenu.font="50px Verdana";
	ctxMenu.fillStyle = "#FF0000"; //red
	ctxMenu.fillText("Game Over", 310, 200);
	ctxMenu.font="35px Verdana";
	ctxMenu.fillStyle = "#0000FF"; //red
	
	oGame.nTotalScore += oGame.nScore;
	
	// determine to show "new record" ribbon by comparing the record.
	if (lastScore == 0)
	{
		ctxMenu.fillText("Score : " + oGame.nTotalScore, 310, 250);
	}
	else if(oGame.nTotalScore < lastScore)
	{
		ctxMenu.fillText("Score : " + oGame.nTotalScore, 310, 250);
		ctxMenu.fillText("High Score : " + lastScore, 310, 300);
		ctxMenu.font="20px Verdana";
		ctxMenu.fillText("<" + lastScoreObj.savedTime + ">", 650, 300);
	}
	else
	{
		ctxMenu.fillText("New high score!!!", 310, 250);
		ctxMenu.fillText("Score : " + oGame.nTotalScore, 310, 300);
	}
	
	var savedTime = lastScoreObj.savedTime;
	
	// get the current datetime
	var currentTime = new Date();
	var month = currentTime.getMonth() + 1;
	var day = currentTime.getDate();
	var year = currentTime.getFullYear();
	var hours = currentTime.getHours();
	var minutes = currentTime.getMinutes();
	/*
	// add padding 0 to minutes
	if (minutes < 10) minutes = "0" + minutes;
	var seconds = currentTime.getSeconds();
	// add padding 0 to seconds
	if (seconds < 10) seconds = "0" + seconds;
	*/
	
	var now = day+"/"+month+"/"+year+" "+hours+":"+minutes; //+":"+seconds;
	if(lastScore < oGame.nTotalScore)
	{
		//construct the object of datetime and game score
		var obj = { "savedTime": now, "score": oGame.nTotalScore};
		// save the score into local storage
		localStorage.setItem("last-score", JSON.stringify(obj));
	}
	oGame.nLevel = 0;
	setTimeout(drawRestart, 6000);
	oChopper.fHP = 1;
}

// when game entered to level clear status
function drawLevelClear(canvasMenu, ctxMenu){
	
	ctxMenu.clearRect(0, 0, canvasMenu.width, canvasMenu.height);
	ctxMenu.font="50px Verdana";
	ctxMenu.fillStyle = "#0000FF"; //blue
	ctxMenu.fillText("Level : " + (oGame.nLevel+1) + " cleared", 245, 150);
	ctxMenu.fillText("Score : " + (oGame.nFrame*10), 300, 220);
	ctxMenu.fillText("Total Score : " + (oGame.nTotalScore + oGame.nFrame*10), 230, 290);
//		ctxMenu.fillText("You saved all the animals", 160, 300);
}

// when game entered to restart game status
function drawRestart(){
	var bgCanvas = document.getElementById("game-background-canvas");
	var gbCtx = bgCanvas.getContext('2d');
	gbCtx.drawImage(oGame.imgBG, 0 ,0);
	initData();
	oGame.nTotalScore = 0;
	$('#menu-scene').removeClass('hide');
}

// when goes to next level
function toNextLevel(){
	var bgCanvas = document.getElementById("game-background-canvas");
	var gbCtx = bgCanvas.getContext('2d');
	gbCtx.drawImage(oGame.imgBG, 0 ,0);
	oGame.nLevel++;
	initData();
	oGame.nStatus = enGameStatus.nPlaying;
	oGame.nStartTime = Date.now();
}

