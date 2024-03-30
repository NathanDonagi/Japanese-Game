import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
scene.add(camera)
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );

var mazeSize = 0

const textureLoader = new THREE.TextureLoader();
const bambooMaterial  = new THREE.MeshStandardMaterial();

const mazeGeometry = new THREE.BoxGeometry(20, 150, 20);
function loadMaze(maze){
    mazeSize = maze.length
    for(let y=0; y<mazeSize; y++){
        for(let x=0; x<mazeSize; x++){
            if(maze[y][x]){
                const cube = new THREE.Mesh( mazeGeometry, bambooMaterial );
                scene.add( cube );
                cube.position.x = x*20
                cube.position.z = y*20
                cube.side = THREE.DoubleSide
            }
        }
    }
}

scene.background = new THREE.Color(0x95dded);;

const sun = new THREE.AmbientLight( 0xD0E0D0, 3 );
scene.add(sun)

let crosshairTexture = new THREE.Texture( generateCrosshairTexture() );
crosshairTexture.needsUpdate = true;
let crosshairMaterial = new THREE.SpriteMaterial( { map: crosshairTexture } );
let crosshairSprite = new THREE.Sprite( crosshairMaterial );
crosshairSprite.position.set( 0, 0, -0.1 );
crosshairSprite.scale.set( 0.001, 0.001, 0.001 );
camera.add( crosshairSprite );

let compassTexture = new THREE.Texture( generateCompassTexture() );
compassTexture.needsUpdate = true;
let compassMaterial = new THREE.SpriteMaterial( { map: compassTexture } );
let compassSprite = new THREE.Sprite( compassMaterial );
compassSprite.position.set( 0.1, -0.04, -0.1 );
compassSprite.scale.set( 0.05, 0.05, 0.05 );
camera.add( compassSprite );

let keys = {'w': false, 'a': false, 's': false, 'd': false}

const velocity = new THREE.Vector3;
const cameraForward = new THREE.Vector3
const cameraRight = new THREE.Vector3
const worldUp = new THREE.Vector3(0, 1, 0);
let speed = 0.5
const cameraDirection = new THREE.Vector3;

const raycaster = new THREE.Raycaster();

var lastUpdate = 0
var afk = false

const controls = new PointerLockControls( camera, renderer.domElement );
controls.rotateSpeed = 0.1;
controls.dampingFactor = 0.1;

function generateCrosshairTexture() {
    var canvas = document.createElement( 'canvas' );
    canvas.width = 500;
    canvas.height = 500;
    var ctx = canvas.getContext( '2d' );
    ctx.fillStyle = "white"
    ctx.beginPath();
    ctx.arc(250, 250, 250, 0, 2 * Math.PI);
    ctx.fill();
    return canvas;
}

function generateCompassTexture() {
    var canvas = document.createElement( 'canvas' );
    canvas.width = 500;
    canvas.height = 500;
    var ctx = canvas.getContext( '2d' );

    ctx.fillStyle = "rgb(150,150,150,0.4)"
    ctx.beginPath();
    ctx.arc(250, 250, 250, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = "black"
    ctx.lineWidth = 5
    ctx.beginPath();
    ctx.arc(250, 250, 246, 0, 2 * Math.PI);
    ctx.stroke()

    ctx.fillStyle = "red"
    ctx.beginPath();
    ctx.moveTo(240,250);
    ctx.lineTo(260,250);
    ctx.lineTo(250,0);
    ctx.lineTo(240,250);
    ctx.fill();

    return canvas;
}

function update(dt) {
    camera.getWorldDirection(cameraDirection)
    camera.getWorldDirection(cameraForward)
    cameraForward.y=0
    cameraRight.copy(cameraForward)
    cameraRight.cross(worldUp)
    velocity.set( 0, 0, 0)
    if(keys['w']) velocity.addScaledVector(cameraForward, speed)
    if(keys['a']) velocity.addScaledVector(cameraRight, -speed)
    if(keys['s']) velocity.addScaledVector(cameraForward, -speed)
    if(keys['d']) velocity.addScaledVector(cameraRight, speed)
    velocity.normalize()

    raycaster.set(camera.position, velocity)
    raycaster.camera = camera

    const intersects = raycaster.intersectObjects( scene.children );
    let distance = speed
    for ( let i = 0; i < intersects.length; i ++ ) {
        if(intersects[i].distance >= 1){
            distance = Math.min(distance, intersects[i].distance-1)
        }else{
            distance = 0
        }
	}

	camera.position.addScaledVector(velocity, distance)
    playerPosition.x = camera.position.x/20
    playerPosition.y = camera.position.z/20

    compassSprite.material.rotation = 3.1415+Math.atan2(cameraForward.x, cameraForward.z);

}

function render() {
    renderer.render( scene, camera );
}

function loop(timestamp) {
    if(quit) return
    window.requestAnimationFrame(loop)
    var dt = (timestamp - lastUpdate)/1000
    if(afk){
        dt - 0
        afk = false
    }

    update(dt)
    render()
    lastUpdate = timestamp
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

export function startMaze(maze, playerPos){
    quit = false
    playerPosition = playerPos
    camera.position.x=playerPosition.x*20
    camera.position.z=playerPosition.y*20
    loadMaze(maze)
    if(document.body.contains(renderer.domElement)) return
    document.body.appendChild( renderer.domElement );
    textureLoader.load('static/assets/images/bamboo.jpeg', function ( texture ) {
        texture.repeat.set( 0.7, 0.9 );
        texture.offset.set( 0.1, 0 );
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        bambooMaterial.map = texture
        bambooMaterial.needsUpdate = true;
        texture.needsUpdate = true;
    });

    textureLoader.load('static/assets/images/ground.jpeg', function ( texture ) {
        texture.repeat.set( 1000, 1000 );
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        const floorMaterial = new THREE.MeshStandardMaterial({map: texture});
        const floorGeometry = new THREE.BoxGeometry(10000, 1, 10000);
        const floor = new THREE.Mesh( floorGeometry, floorMaterial );
        scene.add( floor );
        floor.position.y=-10
    });

    document.addEventListener("keydown", (event) => {
        keys[event.key.toLowerCase()] = true
        if(event.key.toLowerCase() == 'v') keys['arrowdown'] = true
    });

    document.addEventListener("keyup", (event) => {
        keys[event.key.toLowerCase()] = false
        if(event.key.toLowerCase() == 'v') keys['arrowdown'] = false
    });

    document.addEventListener("visibilitychange", (event) => {
       keys = {'w': false, 'a': false, 's': false, 'd': false}
       afk = true
    });

    renderer.domElement.addEventListener( 'click', function () {
        controls.lock()
    })

    controls.addEventListener( 'lock', function () {
    });

    controls.addEventListener( 'unlock', function () {
    });

    window.addEventListener('resize', onWindowResize, false)
    window.requestAnimationFrame(loop)
}

var playerPosition = {"x":0, "y":0}

var quit = true
export function stopMaze(maze){
    quit = true
    if(document.body.contains(renderer.domElement)) document.body.removeChild(renderer.domElement)
}