//-- Imports -------------------------------------------------------------------------------------
import * as THREE from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import { onWindowResize} from "../libs/util/util.js";
import { setFlyNonVRBehavior,
         createVRBasicScene} from "../libs/util/utilVR.js";
	
//-----------------------------------------------------------------------------------------------
//-- MAIN SCRIPT --------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------

//--  General globals ---------------------------------------------------------------------------
var mixer = new Array();
var clock = new THREE.Clock();
var raycaster = new THREE.Raycaster();
let intersections;

//-- Renderer settings ---------------------------------------------------------------------------
let renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color("rgb(70, 150, 240)"));
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	renderer.shadowMap.enabled = true;

//-- Setting scene and camera -------------------------------------------------------------------
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, .1, 1000 );
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// To be used outside a VR environment (Desktop, for example)
let flyCamera = setFlyNonVRBehavior(camera, renderer, "On desktop, use mouse and WASD-QE to navigate.","Teleport available only in VR mode!");

//-- 'Camera Holder' to help moving the camera
let cameraHolder = new THREE.Object3D();
 	 cameraHolder.position.set(0.0, 1.6, 8.0); 
	 cameraHolder.add (camera);
scene.add( cameraHolder );

//-- Create VR button and settings ---------------------------------------------------------------
document.body.appendChild( renderer.domElement );
document.body.appendChild( VRButton.createButton( renderer ) );

// controllers
var controller1 = renderer.xr.getController( 0 );
	controller1.addEventListener( 'selectstart', onSelectStart );
	controller1.addEventListener( 'selectend', onSelectEnd );
cameraHolder.add( controller1 );

//-- VR Camera Rectile ---------------------------------------------------------------------------
const bufflines = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( -0.15, 0, 0 ), new THREE.Vector3( 0.15, 0, 0 ),
															  new THREE.Vector3( 0, -0.15, 0 ), new THREE.Vector3( 0, 0.15, 0 ) ] );
const matNotIntersected = new THREE.MeshBasicMaterial( {color: "rgb(255,255,255)"} );
const matIntersected    = new THREE.MeshBasicMaterial( {color: "rgb(255,100,25)"} );
const rectile = new THREE.LineSegments( bufflines, matNotIntersected );
	rectile.position.set(0, 0, -2.5);
	rectile.visible = false;
controller1.add( rectile );

//-- Creating Scene and calling the main loop ----------------------------------------------------
createVRBasicScene(scene, camera, mixer);
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

function onSelectStart( ) {
	rectile.visible = true;
}

function checkIntersection( controller ) 
{
	if ( rectile.visible ) 
	{
		const intersections = getIntersections( controller );
		if ( intersections.length > 0 )
			rectile.material = matIntersected;		
		else
			rectile.material = matNotIntersected;		
	}
}

function onSelectEnd( event ) {
	const controller = event.target;
	intersections = getIntersections( controller );
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
   let delta = clock.getDelta();
   for(var i = 0; i<mixer.length; i++) 
      mixer[i].update( delta );   
   
   // Controls if VR Mode is ON
   if(renderer.xr.isPresenting){
      checkIntersection( controller1 );	
   }else{
      flyCamera.update( delta ); // Fly desktop behavior	
   }
   renderer.render( scene, camera );   
}