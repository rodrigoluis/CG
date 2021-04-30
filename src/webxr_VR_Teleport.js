// Imports
import * as THREE from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js'
import {onWindowResize,
		degreesToRadians,
		createGroundPlane,
		getMaxSize} from "../libs/util/util.js";

//-----------------------------------------------------------------------------------------------
//-- MAIN SCRIPT --------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------

//--  General globals ---------------------------------------------------------------------------
let intersections;
var mixer = new Array();
var clock = new THREE.Clock();
var raycaster = new THREE.Raycaster();
window.addEventListener( 'resize', onWindowResize );

//-- Renderer settings ---------------------------------------------------------------------------
let renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color("rgb(70, 150, 240)"));
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement );

//-- Setting scene and camera -------------------------------------------------------------------
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, .1, 1000 );

//-- 'Camera Holder' to help moving the camera
const cameraHolder = new THREE.Object3D();
	cameraHolder.position.set(0.0, 1.6, 8.0);
	cameraHolder.add (camera);
scene.add( cameraHolder );

//-- Create VR button and settings ---------------------------------------------------------------
document.body.appendChild( VRButton.createButton( renderer ) );

// controllers
var controller1 = renderer.xr.getController( 0 );
	controller1.addEventListener( 'selectstart', onSelectStart );
	controller1.addEventListener( 'selectend', onSelectEnd );
cameraHolder.add( controller1 );

controller1.addEventListener

//-- VR Camera Rectile ---------------------------------------------------------------------------
const bufflines = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( -0.15, 0, 0 ), new THREE.Vector3( 0.15, 0, 0 ),
															  new THREE.Vector3( 0, -0.15, 0 ), new THREE.Vector3( 0, 0.15, 0 ) ] );
const matNotIntersected = new THREE.MeshBasicMaterial( {color: "rgb(255,255,255)"} );
const matIntersected    = new THREE.MeshBasicMaterial( {color: "rgb(255,100,25)"} );
const rectile = new THREE.LineSegments( bufflines, matNotIntersected );
	rectile.position.set(0, 0, -2.5);
	rectile.visible = false;
controller1.add( rectile );

//-- Create pin to show where the user will be teleported -------------------------------------
// const geometry = new THREE.ConeGeometry( 0.1, 1.0, 20 );
// const material = new THREE.MeshPhongMaterial( {color: "rgb(255,50,50)"} );
// const pin = new THREE.Mesh( geometry, material );	
// 	pin.visible = false;
// 	pin.rotateX(Math.PI);
// scene.add(pin);

// Create Scene
createScene();

// Calling main loop
animate();

//------------------------------------------------------------------------------------------------
//-- FUNCTIONS -----------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------

//-- Teleport functions --------------------------------------------------------------------------
function getIntersections( controller ) 
{
	let tempMatrix = new THREE.Matrix4();
	tempMatrix.identity().extractRotation( controller.matrixWorld );

	raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
	raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( tempMatrix );

	return raycaster.intersectObjects( scene.children );
}

function onSelectStart( event ) {
	rectile.visible = true;
	// const controller = event.target;
	// intersections = getIntersections( controller );

	// if ( intersections.length > 0 ) {
	// 	pin.visible = true;
	// }
}

function pinpointIntersection( controller ) 
{
	if ( rectile.visible ) 
	{
		let p = new THREE.Vector3();		
		const intersections = getIntersections( controller );
		if ( intersections.length > 0 ) {
			rectile.material = matIntersected;
			// pin.visible = true;			
			// p.copy(intersections[ 0 ].point);
			// pin.position.set(p.x, 1.0, p.z);				
		} 		 
		else
		{
			// pin.visible = false;	
			rectile.material = matNotIntersected;		
		}
	}
}

function onSelectEnd( event ) {
	const controller = event.target;
	intersections = getIntersections( controller );
	console.log(intersections)
	if ( intersections.length > 0 ) {
		const intersection = intersections[ 0 ];
		// Effectivelly move the camera to the desired position
		cameraHolder.position.set(intersection.point.x, 1.60, intersection.point.z);
	}
	rectile.visible = false;
}

//-- Main loop -----------------------------------------------------------------------------------
function animate() {
	renderer.setAnimationLoop( render );
}

function render() {
	pinpointIntersection( controller1 );	
	var delta = clock.getDelta(); 
	for(var i = 0; i<mixer.length; i++) mixer[i].update( delta );
	renderer.render( scene, camera );
}

//------------------------------------------------------------------------------------------------
//-- Scene and auxiliary functions ---------------------------------------------------------------
//------------------------------------------------------------------------------------------------

//-- Create Scene --------------------------------------------------------------------------------
function createScene()
{
	// Light stuff --------------------------------------------------
	const light = new THREE.PointLight(0xaaaaaa);
		light.position.set(30,30,20);
		light.castShadow = true;
		light.distance = 0;
		light.shadow.mapSize.width = 1024;
		light.shadow.mapSize.height = 1024;	
	scene.add(light);

	var ambientLight = new THREE.AmbientLight(0x121212);
		scene.add(ambientLight);

	// Load all textures --------------------------------------------
	var textureLoader = new THREE.TextureLoader();
		var floor 	= textureLoader.load('../assets/textures/sand.jpg');	
		var cubeTex = textureLoader.load('../assets/textures/crate.jpg');			

	// Create Ground Plane
	var groundPlane = createGroundPlane(60.0, 60.0, 100, 100, "rgb(200,200,150)");
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
	createWindMill();
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

function createWindMill()
{
	//-- Create windmill sound --------------------------------------       
	var listener = new THREE.AudioListener();
	camera.add( listener );
	const windmillSound = new THREE.PositionalAudio( listener );
	var audioLoader = new THREE.AudioLoader();
		audioLoader.load( '../assets/sounds/sampleSound.ogg', function ( buffer ) {
		windmillSound.setBuffer( buffer );
		windmillSound.setLoop(true);
		windmillSound.play(); 
	} ); 

	// Load GLTF windmill
	var modelPath = '../assets/objects/windmill/';
	var modelName = 'scene.gltf';
	var loader = new GLTFLoader( );
	loader.load( modelPath + modelName, function ( gltf ) {
	var obj = gltf.scene;
		obj.traverse( function ( child ) {
			if ( child ) { child.castShadow = true; }
		});
		obj = normalizeAndRescale(obj, 8);
		obj.rotateY(degreesToRadians(-90));				
		obj.add( windmillSound ); // Add sound to windmill
	scene.add ( obj );

	// Create animationMixer and push it in the array of mixers
	var mixerLocal = new THREE.AnimationMixer(obj);
	mixerLocal.clipAction( gltf.animations[0] ).play();
	mixer.push(mixerLocal);
	return obj;
	}, null, null);
}

// Normalize scale and multiple by the newScale
function normalizeAndRescale(obj, newScale)
{
  var scale = getMaxSize(obj); // Available in 'utils.js'
  obj.scale.set(newScale * (1.0/scale),
                newScale * (1.0/scale),
                newScale * (1.0/scale));
  return obj;
}
