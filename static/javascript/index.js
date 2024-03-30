import { startMaze, stopMaze } from './maze.js';
import { startGuide, stopGuide } from './guide.js';
import * as THREE from 'three';
import { io } from "https://cdn.socket.io/4.3.0/socket.io.esm.min.js";
const socket = io();
var state = "lobby"
var currentInterval = null

var maze = [[false]]

const player = {"x":-2, "y":1}

function refreshServers(){
    socket.emit("getNewGames")
}

function abandonCurrentServer(){
    socket.emit("abandonServer", {"gameName": currentGame})
    if(!document.contains(box)) document.body.appendChild(box)
    if(document.contains(abandonServerButton)) document.body.removeChild(abandonServerButton)
    currentGame = null
}

function createServer(name){
    currentGame = name
    state = "guide"
    currentInterval = beginKeepAlive()
    socket.emit("serverStart", {"gameName": currentGame})
}

function keepAlive(name){
    socket.emit("keepRoomAlive", {"gameName": name})
}

function broadcastPosition(){
    socket.emit("playerPosition", {"gameName": currentGame, "position": player})
}

function joinGame(name){
    socket.emit("gameStart", {"gameName": name})
    currentGame = name
    document.body.removeChild(tableBody)
    state = "maze"
}

const box = document.createElement('flex-container')
document.body.appendChild(box)

const refreshServersButton = document.createElement('button')
refreshServersButton.innerText = 'Refresh Lobbies'
box.appendChild(refreshServersButton)
refreshServersButton.onclick = refreshServers

const serverNameInput = document.createElement("input");
serverNameInput.setAttribute("type", "text");
box.appendChild(serverNameInput);

const createServerButton = document.createElement('button')
createServerButton.innerText = 'Create Server'
box.appendChild(createServerButton);
createServerButton.addEventListener('click', ()=>{
    if(!serverNameInput.value) return
    createServer(serverNameInput.value);
    if(document.contains(box)) document.body.removeChild(box)
    if(!document.contains(abandonServerButton)) document.body.appendChild(abandonServerButton);
})

const abandonServerButton = document.createElement('button')
abandonServerButton.setAttribute("class", "abandon-button");
abandonServerButton.innerText = 'Abandon Server'
abandonServerButton.addEventListener('click', ()=>{
    abandonCurrentServer();
})

function beginKeepAlive(){
    const interval = setInterval(function() {
        keepAlive(currentGame)
     }, 5000);
     return interval
}

function beginPositionBroadcast(){
    const interval = setInterval(function() {
        broadcastPosition()
     }, 10);
     return interval
}

var openServers = []
var currentGame = null

const tableBody = document.createElement('flex-container')
tableBody.setAttribute("class", "server-table");

socket.on("listGames", (arg) => {
    if(!document.body.contains(tableBody) && openServers.length>0){
        document.body.appendChild(tableBody)
    }

    if(document.body.contains(tableBody) && openServers.length==0){
        document.body.removeChild(tableBody)
        return
    }

    openServers = arg;
    const tableData = openServers.map(value => {
      return (
        `<div class=row><h>${value}</h> <button id=${value.replace(" ", "_")}Button>Join</button></div>`
      );
    }).join('');
    if(openServers.length>0){
        tableBody.innerHTML = tableData;
    }
    for(const server of openServers){
        console.log(`${server.replace(" ", "_")}Button`)
        const button = document.getElementById(`${server.replace(" ", "_")}Button`)
        button.addEventListener('click', ()=>{
            joinGame(server)
        })
    }
});

socket.on("gameStart", (arg) => {
    if(document.contains(box)) document.body.removeChild(box)
    if(document.contains(abandonServerButton)) document.body.removeChild(abandonServerButton)
    maze = arg
    if(state == "maze") {
        startMaze(maze, player)
        currentInterval = beginPositionBroadcast()
    } else{
        startGuide(maze, player)
        currentInterval = null
    }
});

socket.on("playerPosition", (arg) => {
    if(state == "guide"){
        player.x = arg['position'].x
        player.y = arg['position'].y
    }
});