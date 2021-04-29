/*
UNDER DEVELOPMENT
*/

import * as THREE from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js'
import Stats from '../build/jsm/libs/stats.module.js';
import {onWindowResize,
		initDefaultLighting,
		degreesToRadians,
		createGroundPlane,
		getMaxSize} from "../libs/util/util.js";

//-- Setting renderer ---------------------------------------------------------------------------
let renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	renderer.xr.setReferenceSpaceType( 'local-floor' );

var stats = new Stats();
var clock = new THREE.Clock();;
         // To show FPS information

//-- Append renderer and create VR button -------------------------------------------------------
document.body.appendChild( renderer.domElement );
document.body.appendChild( VRButton.createButton( renderer ) );
window.addEventListener( 'resize', onWindowResize );

//-- Setting scene and camera -------------------------------------------------------------------
let scene = new THREE.Scene();
const light = new THREE.PointLight(0xffffff);
	light.position.set(20,20,20);
	light.castShadow = true;
	light.shadow.mapSize.width = 512;
	light.shadow.mapSize.height = 512;
scene.add(light);

var ambientLight = new THREE.AmbientLight(0x343434);
	scene.add(ambientLight);

let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, .1, 3000 );
camera.layers.enable( 1 );

const cameraHolder = new THREE.Object3D();
scene.add( cameraHolder );
cameraHolder.position.set(0.0, 1.6, 8.0);
cameraHolder.add (camera);


// controllers
var controller1 = renderer.xr.getController( 0 );
controller1.addEventListener( 'selectstart', onSelectStart );
controller1.addEventListener( 'selectend', onSelectEnd );
cameraHolder.add( controller1 );

// // create a sphere
var sphereGeometry = new THREE.SphereGeometry(0.5, 20, 20);
var sphereMaterial = new THREE.MeshNormalMaterial();
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);
sphere.visible = false;

// VR Camera Rectile
var ringGeo = new THREE.RingGeometry( .05, .1, 32 );
var ringMat = new THREE.MeshBasicMaterial( {
	color:"rgb(255,255,0)", 
	opacity: 0.9, 
	transparent: true } );
var rectile = new THREE.Mesh( ringGeo, ringMat );
 	rectile.position.set(0, 0, -2);
controller1.add( rectile );


//-- Create environment -------------------------------------------------------------------------
//-- Creating equirectangular Panomara ----------------------------------------------------------
// const geometry = new THREE.SphereGeometry( 1000, 60, 60 );
// const texture = new THREE.TextureLoader().load( '../assets/textures/panorama2.jpg' );
// var material = new THREE.MeshBasicMaterial({
//     color:"rgb(255,255,255)",     // Main color of the object
// 	map: texture,
// 	side: THREE.BackSide
//   });
// const mesh = new THREE.Mesh( geometry, material );
// scene.add( mesh );

// // // create the ground plane
// var angle = degreesToRadians(-90);
// var rotAxis = new THREE.Vector3(1,0,0); // Set Z axis
// const floorPosition = -150.0;
// var planeGeometry = new THREE.PlaneGeometry(2000, 2000, 50, 50);
// var planeMaterial = new THREE.MeshBasicMaterial({
//     color:"rgb(200,200,200)",     // Main color of the object
//     wireframe: true,
// 	opacity: 0.7, 
// 	transparent: true
//   });
// var plane = new THREE.Mesh(planeGeometry, planeMaterial);
// 	plane.position.set(0.0, floorPosition, 0.0);
// 	plane.rotateOnAxis(rotAxis,  angle );
// scene.add(plane);

//-- Raycaster 
var raycaster = new THREE.Raycaster();
let intersections;

var mixer = new Array();
//-- Start main loop
createScene();
//audioSetup();
animate();


function getIntersections( controller ) 
{
	let tempMatrix = new THREE.Matrix4();
	tempMatrix.identity().extractRotation( controller.matrixWorld );

	raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
	raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

	return raycaster.intersectObjects( scene.children );
}

function onSelectStart( event ) {

	const controller = event.target;
	intersections = getIntersections( controller );

	if ( intersections.length > 0 ) {
		rectile.visible = false;
		const intersection = intersections[ 0 ];
		sphere.position.set(intersection.point.x, intersection.point.y, intersection.point.z);
		sphere.visible = true;
	}
}

function onSelectEnd( event ) {
	rectile.visible = true;
	sphere.visible = false;
	if ( intersections.length > 0 ) {
		const intersection = intersections[ 0 ];
		//if(intersection.point.y < floorPosition+1) intersection.point.y = 1.60;
		cameraHolder.position.set(intersection.point.x, 1.60, intersection.point.z);
	}
}

// function render() {
// 	renderer.render( scene, camera );
// }


//
function animate() {
	renderer.setAnimationLoop( render );
}

function render() {
	stats.update();
	var delta = clock.getDelta(); // Get the seconds passed since the time 'oldTime' was set and sets 'oldTime' to the current time.	
	//lightFollowingCamera(light, camera) // Makes light follow the camera
	// cleanIntersected();
	// intersectObjects( controller1 );
	  // Animation control
		for(var i = 0; i<mixer.length; i++)
		  mixer[i].update( delta );
		//rotateMan(delta);

	renderer.render( scene, camera );
}

//--Auxiliary functions
function createScene()
{
	var listener = new THREE.AudioListener();
	camera.add( listener );

	// create a global audio source
	const sound = new THREE.Audio( listener );  

	//-- Create windmill sound ---------------------------------------------------       
	const windmillSound = new THREE.PositionalAudio( listener );
	var audioLoader = new THREE.AudioLoader();
	audioLoader.load( '../assets/sounds/sampleSound.ogg', function ( buffer ) {
	windmillSound.setBuffer( buffer );
	windmillSound.play(); // Will play when start button is pressed
	} ); // Will be added to the target object

	var groundPlane = createGroundPlane(25.0, 25.0, 60, 60, "rgb(100,140,90)");
	groundPlane.rotateX(degreesToRadians(-90));
	scene.add(groundPlane);

	// Load GLTF windmill
	var modelPath = '../assets/objects/windmill/';
	var modelName = 'scene.gltf';
	var loader = new GLTFLoader( );
	loader.load( modelPath + modelName, function ( gltf ) {
	var obj = gltf.scene;
	obj.traverse( function ( child ) {
		if ( child ) {
			child.castShadow = true;
		}
	});
	obj.traverse( function( node )
	{
		if( node.material ) node.material.side = THREE.DoubleSide;
	});

	// Only fix the position of the windmill
	// if(centerObject)
	// {
		obj = normalizeAndRescale(obj, 8);
		obj = fixPosition(obj);
		// obj.rotateX(degreesToRadians(-90));
		// obj.rotateZ(degreesToRadians(-90));		
		obj.rotateY(degreesToRadians(-90));				
		obj.add( sound ); // Add sound to windmill
	// }
	// else {
	// 	man = obj;
	// 	rotateMan(0);
	// }
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

function fixPosition(obj)
{
  // Fix position of the object over the ground plane
  var box = new THREE.Box3().setFromObject( obj );
  if(box.min.y > 0)
    obj.translateY(-box.min.y);
  else
    obj.translateY(-1*box.min.y);
  return obj;
}