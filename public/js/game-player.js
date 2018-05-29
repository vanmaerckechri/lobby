let avatars = ['black', 'red', 'blue', 'yellow', 'green', 'purple'];
let playerIndex;
let player = {
    playerMovingTempo: '',
    moving: false,
    posX: tileSize,
    posY: tileSize,
    bombsNumberMax: 1,
    bombsNumber: 2,
    topPressed: false,
    rightPressed: false,
    bottomPressed: false,
    leftPressed: false,
    animationX: [57, 114],
    animationXIndex: 0,
    animationY: 0,
    spacePressed: false,
    spaceStopPressed: true,
    color: '',
    alive: 1
    };
let players = [];
let playerImg = new Image();
playerImg.src = 'assets/img/player.png';

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e)
{
    if (players[playerIndex].alive == 1)
    {
        //joueur 1
    	if(e.keyCode == 39)
    	{
    	    players[playerIndex].rightPressed = true;
    	}
    	else if(e.keyCode == 37)
    	{
    	    players[playerIndex].leftPressed = true;
    	}
    	else if(e.keyCode == 40)
    	{
    	    players[playerIndex].bottomPressed = true;
    	}
    	else if(e.keyCode == 38)
    	{
    	    players[playerIndex].topPressed = true;
    	}
    	else if(e.keyCode == 32 && players[playerIndex].spaceStopPressed == true)
    	{
    	    players[playerIndex].spacePressed = true;
    	    players[playerIndex].spaceStopPressed = false;
    	}
    }
}
function keyUpHandler(e)
{
    if (players[playerIndex].alive == 1)
    {
        //joueur 1
        if(e.keyCode == 39)
        {
            players[playerIndex].rightPressed = false;
        }
        else if(e.keyCode == 37)
        {
            players[playerIndex].leftPressed = false;
        }
        else if(e.keyCode == 40)
        {
            players[playerIndex].bottomPressed = false;
        }
        else if(e.keyCode == 38)
        {
            players[playerIndex].topPressed = false;
        }
        else if(e.keyCode == 32)
        {
            players[playerIndex].spacePressed = false;
          	players[playerIndex].spaceStopPressed = true;
        }
    }
}

function drawPlayer()
{
    if (playerIndex != undefined && players[playerIndex].alive == 1)
    {
        let playerPosArrayCol;
        let playerPosArrayRow;
        let playerMovingSpeed = tileSize / 16;
        // MOVE TOP
        if (players[playerIndex].moving == false && players[playerIndex].topPressed == true)
        {
            playerPosArrayCol = players[playerIndex].posX / tileSize;
            playerPosArrayRow = players[playerIndex].posY / tileSize;

            if (mapBoards[playerPosArrayRow - 1][playerPosArrayCol].wall < 1)
            {
                players[playerIndex].moving = true;
                players[playerIndex].playerMovingTempo = setInterval(function()
                {
                    players[playerIndex].animationY = 64;

                    players[playerIndex].posY -= playerMovingSpeed;
                    if (players[playerIndex].posY % tileSize === 0)
                    {
                        players[playerIndex].animationXIndex = players[playerIndex].animationXIndex < 1 ? players[playerIndex].animationXIndex += 1 : 0;
                        players[playerIndex].moving = false;
                        clearInterval(players[playerIndex].playerMovingTempo);
                    }
                },10);
            }
        }
        // MOVE BOTTOM
        if (players[playerIndex].moving == false && players[playerIndex].bottomPressed == true)
        {
            playerPosArrayCol = players[playerIndex].posX / tileSize;
            playerPosArrayRow = players[playerIndex].posY / tileSize;

            if (mapBoards[playerPosArrayRow + 1][playerPosArrayCol].wall < 1)
            {
                players[playerIndex].moving = true;
                players[playerIndex].playerMovingTempo = setInterval(function()
                {   
                    players[playerIndex].animationY = 0;

                    players[playerIndex].posY += playerMovingSpeed;
                    if (players[playerIndex].posY % tileSize === 0)
                    {
                        players[playerIndex].animationXIndex = players[playerIndex].animationXIndex < 1 ? players[playerIndex].animationXIndex += 1 : 0;
                        players[playerIndex].moving = false;
                        clearInterval(players[playerIndex].playerMovingTempo);
                    }
                },10);
            }
        }
        // MOVE RIGHT
        if (players[playerIndex].moving == false && players[playerIndex].rightPressed == true)
        {
            playerPosArrayCol = players[playerIndex].posX / tileSize;
            playerPosArrayRow = players[playerIndex].posY / tileSize;
            if (mapBoards[playerPosArrayRow][playerPosArrayCol + 1].wall < 1)
            {
                players[playerIndex].moving = true;
                players[playerIndex].playerMovingTempo = setInterval(function()
                {
                    players[playerIndex].animationY = 316;

                    players[playerIndex].posX += playerMovingSpeed;
                    if (players[playerIndex].posX % tileSize === 0)
                    {
                        players[playerIndex].animationXIndex = players[playerIndex].animationXIndex < 1 ? players[playerIndex].animationXIndex += 1 : 0;
                        players[playerIndex].moving = false;
                        clearInterval(players[playerIndex].playerMovingTempo);
                    }
                },10);
            }
        }
        // MOVE LEFT
        if (players[playerIndex].moving == false && players[playerIndex].leftPressed == true)
        {
            playerPosArrayCol = players[playerIndex].posX / tileSize;
            playerPosArrayRow = players[playerIndex].posY / tileSize;

            if (mapBoards[playerPosArrayRow][playerPosArrayCol -1].wall < 1)
            {
                players[playerIndex].moving = true;
                players[playerIndex].playerMovingTempo = setInterval(function()
                {
                    players[playerIndex].animationY = 128;

                    players[playerIndex].posX -= playerMovingSpeed;
                    if (players[playerIndex].posX % tileSize === 0)
                    {
                        players[playerIndex].animationXIndex = players[playerIndex].animationXIndex < 1 ? players[playerIndex].animationXIndex += 1 : 0;
                        players[playerIndex].moving = false;
                        clearInterval(players[playerIndex].playerMovingTempo);
                    }
                },10);
            }
        }
        // DROP BOMB
        let playerPosRow = players[playerIndex].posY / tileSize;
        playerPosRow = parseInt(playerPosRow);
        let playerPosCol = players[playerIndex].posX / tileSize;
        playerPosCol = parseInt(playerPosCol);
        if (players[playerIndex].bombsNumber > 0 && players[playerIndex].spacePressed == true && mapBoards[playerPosRow][playerPosCol].wall == 0)
        {
            players[playerIndex].bombsNumber--;
            players[playerIndex].spacePressed = false;
            dropBombs(playerIndex, playerPosRow, playerPosCol);
            socket.emit('sendBombInfos', { playerIndex: playerIndex, playerPosRow: playerPosRow, playerPosCol: playerPosCol });
        }
        console.log(players[playerIndex].animationXIndex);

        ctx.drawImage(playerImg, players[playerIndex].animationX[players[playerIndex].animationXIndex], players[playerIndex].animationY, 51, 64, players[playerIndex].posX, players[playerIndex].posY, tileSize, tileSize);

        /*
        ctx.beginPath();
        ctx.rect(players[playerIndex].posX, players[playerIndex].posY, tileSize, tileSize);
        ctx.fillStyle = players[playerIndex].color;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.fill();
        ctx.stroke();
        ctx.closePath();*/
    }
}
function drawOtherPlayers()
{
    for (let i = 0, playersLength = players.length; i < playersLength; i++)
    {
        if (i != playerIndex && players[i].alive == 1)
        {
            ctx.beginPath();
            ctx.rect(players[i].posX, players[i].posY, tileSize, tileSize);
            ctx.fillStyle = players[i].color;
            ctx.strokeStyle = 'rgb(0, 0, 0)';
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        }
    }
}