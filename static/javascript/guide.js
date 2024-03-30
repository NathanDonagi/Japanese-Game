const canvas = document.createElement('canvas');
canvas.width = window.innerWidth
canvas.height= window.innerWidth

const textDisplay = document.createElement('display');

const ctx = canvas.getContext("2d");
function getNeighbors(coord){
    let x = coord[0]
    let y = coord[1]
    let output = []
    for(const c of [[x,y+1], [x,y-1], [x+1,y], [x-1,y]]){
        if(c[0]>=0 && c[0]<maze.length && c[1]>=0 && c[1]<maze[0].length && !maze[c[0]][c[1]]) output.push(c)
    }
    return output
}

const visited = new Set()

function dfs(node, end){
    visited.add(`${node[0]}_${node[1]}`)
    if(node[0] == end[0] && node[1] == end[1]) return [node]
    for(const c of getNeighbors(node)){
        if(!visited.has(`${c[0]}_${c[1]}`)){
            let path = dfs(c, end)
            if(path) return [node].concat(path)
        }
    }
    return null
}

let enterMaze = ["めいろをはいります"]
let rightDirections = ["みぎにいきます", "ひがしにいきます", "ますぐいきます"]
let leftDirections = ["ひだりにいきます", "にしにいきます", "ますぐいきます"]
let upDirections = ["うえにいきます", "きたにいきます", "ますぐいきます"]
let downDirections = ["したにいきます", "みなみにいきます", "ますぐいきます"]
let leaveMaze = ["めいろをでます"]
let directions = [enterMaze, rightDirections, leftDirections, upDirections, downDirections, leaveMaze]
let displayState = 0
let previousDisplayState = 0
var path = []

function randomlyChoose(list){
    let r = Math.floor(Math.random() * list.length)
    return list[r]
}

function update(dt) {
    let end = [maze.length-2, maze.length-1]
    visited.clear()
    if(getNeighbors([playerY, playerX]).length>0){
        path = dfs([playerY, playerX], end)
        if(!path) return
        console.log(path)
        let nextStep = path[1]
        let currentLocation = [playerY, playerX]
        let xDiff = nextStep[0] - currentLocation[0]
        let yDiff = nextStep[1] - currentLocation[1]

        if(yDiff == 1){
            displayState = 1
        }else if(yDiff == -1){
            displayState = 2
        }else if(xDiff == -1){
            displayState = 3
        }else if(xDiff == 1){
            displayState = 4
        }

        if(path.length < 3){
             displayState = 5
        }

        if(previousDisplayState != displayState){
            textDisplay.innerHTML = randomlyChoose(directions[displayState])
            previousDisplayState = displayState
        }
    }
}

var lastUpdate = 0
var quit = true
var playerPosition = {"x":0, "y":0}
var playerX = -10
var playerY = -10
var maze = [[false]]
var mazeAspectRatio = 1
var squareWidth = canvas.width/maze.length

function render() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    for(let y=0; y<maze.length; y++){
        for(let x=0; x<maze[y].length; x++){
            if(maze[y][x]){
                ctx.fillStyle = "rgb(140, 120, 90)"
            } else {
                ctx.fillStyle = "rgb(196, 196, 196)"
            }
            ctx.fillRect(x*squareWidth,y*squareWidth,squareWidth+1,squareWidth+1)
        }
    }

    ctx.fillStyle = "rgb(150, 140, 110)"
    if(path.length > 0){
        for(const coord of path){
            let y = coord[0]
            let x = coord[1]
            ctx.fillRect(x*squareWidth,y*squareWidth,squareWidth+1,squareWidth+1)
        }
    }

    ctx.fillStyle = "red"
    let playerCenterX = playerPosition.x*squareWidth+squareWidth/4
    let playerCenterY = playerPosition.y*squareWidth+squareWidth/4

    playerX = Math.round(playerPosition.x)
    playerY = Math.round(playerPosition.y)

    if(0<=playerY && playerY<maze.length && 0<=playerX+1 && playerX+1<maze[playerY].length && maze[playerY][playerX+1]) playerCenterX = Math.min(playerCenterX, (playerX+1)*squareWidth-squareWidth/2)
    if(0<=playerY && playerY<maze.length && 0<=playerX-1 && playerX-1<maze[playerY].length && maze[playerY][playerX-1]) playerCenterX = Math.max(playerCenterX, playerX*squareWidth)
    if(0<=playerY+1 && playerY+1<maze.length && 0<=playerX && playerX<maze[playerY+1].length && maze[playerY+1][playerX]) playerCenterY = Math.min(playerCenterY, (playerY+1)*squareWidth-squareWidth/2)
    if(0<=playerY-1 && playerY-1<maze.length && 0<=playerX && playerX<maze[playerY-1].length && maze[playerY-1][playerX]) playerCenterY = Math.max(playerCenterY, playerY*squareWidth)

    ctx.fillRect(playerCenterX, playerCenterY, squareWidth/2, squareWidth/2)
}

function loop(timestamp) {
    if(quit) return
    update()
    render()
    lastUpdate = timestamp
    window.requestAnimationFrame(loop)
}

window.addEventListener('resize', onWindowResize, false)

export function stopGuide(maze){
    quit = true
    if(document.body.contains(canvas)) document.body.removeChild(canvas)
}

export function startGuide(newMaze, playerPos){
    quit = false
    maze = newMaze
    mazeAspectRatio = maze.length/maze[0].length
    squareWidth = canvas.width/maze.length
    playerPosition = playerPos
    if(!document.body.contains(textDisplay)) document.body.appendChild(textDisplay);
    textDisplay.innerHTML = randomlyChoose(enterMaze)
    if(!document.body.contains(canvas)) document.body.appendChild(canvas);
    onWindowResize()
    window.requestAnimationFrame(loop)
}

function onWindowResize() {
    canvas.width = window.innerWidth*0.8
    canvas.height = canvas.width*mazeAspectRatio
    if(canvas.height > window.innerHeight*0.8){
        canvas.height = window.innerHeight*0.8
        canvas.width = canvas.height/mazeAspectRatio
    }
    squareWidth = canvas.width/maze.length
}


