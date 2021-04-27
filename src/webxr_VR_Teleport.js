/*
UNDER DEVELOPMENT
*/

import * as THREE from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import {onWindowResize,
		initDefaultLighting,
		degreesToRadians } from "../libs/util/util.js";

//-- Setting renderer ---------------------------------------------------------------------------
let renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.xr.enabled = true;
	renderer.xr.setReferenceSpaceType( 'local-floor' );

//-- Append renderer and create VR button -------------------------------------------------------
document.body.appendChild( renderer.domElement );
document.body.appendChild( VRButton.createButton( renderer ) );
window.addEventListener( 'resize', onWindowResize );

//-- Setting scene and camera -------------------------------------------------------------------
let scene = new THREE.Scene();
initDefaultLighting(scene, new THREE.Vector3(250, 40, 2));

let camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 3000 );
camera.layers.enable( 1 );

const cameraHolder = new THREE.Object3D();
scene.add( cameraHolder );
cameraHolder.add (camera);

// controllers
var controller1 = renderer.xr.getController( 0 );
controller1.addEventListener( 'selectstart', onSelectStart );
controller1.addEventListener( 'selectend', onSelectEnd );
cameraHolder.add( controller1 );

// // create a sphere
var sphereGeometry = new THREE.SphereGeometry(10, 60, 60);
var sphereMaterial = new THREE.MeshNormalMaterial();
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// VR Camera Rectile
var ringGeo = new THREE.RingGeometry( 3, 6, 32 ).translate( 0, 0, - 1 );
var ringMat = new THREE.MeshBasicMaterial( { opacity: 0.9, transparent: true } );
var rectile = new THREE.Mesh( ringGeo, ringMat );
 	rectile.position.set(0, 0, -150);
controller1.add( rectile );

//-- Create environment -------------------------------------------------------------------------
//-- Creating equirectangular Panomara ----------------------------------------------------------
const geometry = new THREE.SphereGeometry( 1000, 60, 60 );
	geometry.scale( -1, 1, 1 ); // invert the geometry on the x-axis (faces will point inward)
const texture = new THREE.TextureLoader().load( '../assets/textures/panorama2.jpg' );
var material = new THREE.MeshBasicMaterial({
    color:"rgb(255,255,255)",     // Main color of the object
	map: texture
  });
const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

// // create the ground plane
var angle = degreesToRadians(-90);
var rotAxis = new THREE.Vector3(1,0,0); // Set Z axis
const floorPosition = -150.0;
var planeGeometry = new THREE.PlaneGeometry(2000, 2000, 50, 50);
var planeMaterial = new THREE.MeshBasicMaterial({
    color:"rgb(200,200,200)",     // Main color of the object
    wireframe: true
  });
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
	plane.position.set(0.0, floorPosition, 0.0);
	plane.rotateOnAxis(rotAxis,  angle );
scene.add(plane);

//-- Raycaster 
var raycaster = new THREE.Raycaster();
let intersections;

//-- Start main loop
renderer.setAnimationLoop( render );

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
	}
}

function onSelectEnd( event ) {
	rectile.visible = true;
	if ( intersections.length > 0 ) {
		const intersection = intersections[ 0 ];
		if(intersection.point.y < floorPosition+1) intersection.point.y = 1.60;
		cameraHolder.position.set(intersection.point.x,  intersection.point.y, intersection.point.z);
	}
}

// function intersectObjects( controller ) {
// 	if(select && intersections.length > 0 )
// 	{
// 		const intersection = intersections[ 0 ];
// 		sphere.position.set(intersection.point.x, intersection.point.y, intersection.point.z);
// 	}
// }

function render() {
	//intersectObjects(controller1);
	renderer.render( scene, camera );
}