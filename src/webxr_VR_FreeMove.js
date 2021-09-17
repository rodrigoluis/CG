//-- Imports -------------------------------------------------------------------------------------
import * as THREE from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import {onWindowResize,
		degreesToRadians,
		createGroundPlane} from "../libs/util/util.js";
import {setFlyNonVRBehavior,
		updateFlyNonVRBehavior} from "../libs/util/utilVR.js";
//-----------------------------------------------------------------------------------------------
//-- MAIN SCRIPT --------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------

//--  General globals ---------------------------------------------------------------------------
window.addEventListener( 'resize', onWindowResize );

//-- Renderer settings ---------------------------------------------------------------------------
let renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color("rgb(70, 150, 240)"));
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;

//-- Setting scene and camera -------------------------------------------------------------------
let scene = new THREE.Scene();

let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, .1, 1000 );
let moveCamera; // Move when a button is pressed 

// To be used outside a VR environment (Desktop, for example)
setFlyNonVRBehavior(camera, renderer, "On desktop, use mouse and WASD-QE to navigate");

//-- 'Camera Holder' to help moving the camera
let cameraHolder = new THREE.Object3D();
	cameraHolder.position.set(0.0, 1.0, 0.0);
cameraHolder.add(camera);
scene.add( cameraHolder );
//-- Create VR button and settings ---------------------------------------------------------------
document.body.appendChild( renderer.domElement );
document.body.appendChild( VRButton.createButton( renderer ) );

// controllers
var controller1 = renderer.xr.getController( 0 );
	controller1.addEventListener( 'selectstart', onSelectStart );
	controller1.addEventListener( 'selectend', onSelectEnd );
camera.add( controller1 );

//-- Creating Scene and calling the main loop ----------------------------------------------------
createScene();
animate();

//------------------------------------------------------------------------------------------------
//-- FUNCTIONS -----------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------

function move()
{
	if(moveCamera)
	{
		// Get Camera Rotation
		let quaternion = new THREE.Quaternion();
		quaternion = camera.quaternion;

		// Get direction to translate from quaternion
		var moveTo = new THREE.Vector3(0, 0, -0.1);
		moveTo.applyQuaternion(quaternion);

		// Move the camera Holder to the computed direction
		cameraHolder.translateX(moveTo.x);
		cameraHolder.translateY(moveTo.y);
		cameraHolder.translateZ(moveTo.z);	
	}
}

function onSelectStart( ) 
{
	moveCamera = true;
}

function onSelectEnd( ) 
{
	moveCamera = false;
}

//-- Main loop -----------------------------------------------------------------------------------
function animate() 
{
	renderer.setAnimationLoop( render );
}

function render() {
	updateFlyNonVRBehavior(); // Fly desktop behavior
	move();
	renderer.render( scene, camera );
}

//------------------------------------------------------------------------------------------------
//-- Scene and auxiliary functions ---------------------------------------------------------------
//------------------------------------------------------------------------------------------------

//-- Create Scene --------------------------------------------------------------------------------
function createScene()
{
	// Light stuff 
	const light = new THREE.PointLight(0xaaaaaa);
		light.position.set(30,30,20);
		light.castShadow = true;
		light.distance = 0;
		light.shadow.mapSize.width = 1024;
		light.shadow.mapSize.height = 1024;	
	scene.add(light);

	var ambientLight = new THREE.AmbientLight(0x121212);
		scene.add(ambientLight);

	// Load all textures 
	var textureLoader = new THREE.TextureLoader();
		var floor 	= textureLoader.load('../assets/textures/sand.jpg');	
		var cubeTex = textureLoader.load('../assets/textures/crate.jpg');			

	// Create Ground Plane
	var groundPlane = createGroundPlane(80.0, 80.0, 100, 100, "rgb(200,200,150)");
		groundPlane.rotateX(degreesToRadians(-90));
		groundPlane.material.map = floor;		
		groundPlane.material.map.wrapS = THREE.RepeatWrapping;
		groundPlane.material.map.wrapT = THREE.RepeatWrapping;
		groundPlane.material.map.repeat.set(8,8);		
	scene.add(groundPlane);

	// Create feature cubes [size, xPos, zPos, textureName]
	createCube(3.0, -20.0, -20.0, cubeTex);
	createCube(1.0, -15.0,  12.0, cubeTex);
	createCube(1.0, -10.0,  -5.0, cubeTex);
	createCube(1.0,  -5.0,  13.0, cubeTex);
	createCube(1.0,   5.0,  10.0, cubeTex);
	createCube(1.0,  10.0, -15.0, cubeTex);
	createCube(1.0,  20.0, -12.0, cubeTex);
	createCube(4.0,  20.0,  22.0, cubeTex);		
}

function createCube(cubeSize, xPos, zPos, texture)
{
	var cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
	var cubeMaterial = new THREE.MeshLambertMaterial();
	var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cube.castShadow = true;
		cube.receiveShadow = true;		
		cube.position.set(xPos, cubeSize/2.0, zPos);
		cube.material.map = texture;
	scene.add(cube);	
}
