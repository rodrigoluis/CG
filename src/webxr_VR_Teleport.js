/*
NOT WORKING - UNDER DEVELOPMENT
*/

import * as THREE from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from '../build/jsm/webxr/XRControllerModelFactory.js';
import {onWindowResize,
		initDefaultLighting,
		degreesToRadians } from "../libs/util/util.js";

const intersected = [];
const tempMatrix = new THREE.Matrix4();
//let cameraPosition = new THREE.Matrix3();

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

const train = new THREE.Object3D();
scene.add( train );
train.add (camera);

// controllers
var controller1 = renderer.xr.getController( 0 );
controller1.addEventListener( 'selectstart', onSelectStart );
controller1.addEventListener( 'selectend', onSelectEnd );
scene.add( controller1 );

// var controller2 = renderer.xr.getController( 1 );
// controller2.addEventListener( 'selectstart', onSelectStart );
// controller2.addEventListener( 'selectend', onSelectEnd );
// scene.add( controller2 );

//
const geoline = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

const line = new THREE.Line( geoline );
line.name = 'line';
line.scale.z = 5;

controller1.add( line.clone() );
//controller2.add( line.clone() );

var raycaster = new THREE.Raycaster();

//-- Creating equirectangular Panomara ----------------------------------------------------------
const geometry = new THREE.SphereGeometry( 1000, 60, 60 );
	geometry.scale( - 1, 1, 1 ); // invert the geometry on the x-axis (faces will point inward)

const texture = new THREE.TextureLoader().load( '../assets/textures/panorama2.jpg' );
var material = new THREE.MeshBasicMaterial({
    color:"rgb(255,255,255)",     // Main color of the object
    //wireframe: true,
	map: texture
  });
//const material = new THREE.MeshBasicMaterial( { map: texture } )
const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

// // create the ground plane
var angle = degreesToRadians(-90);
var rotAxis = new THREE.Vector3(1,0,0); // Set Z axis
const texture2 = new THREE.TextureLoader().load("../assets/textures/sand.jpg");

var planeGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
//var planeMaterial = new THREE.MeshBasicMaterial({map:texture2});
var planeMaterial = new THREE.MeshBasicMaterial({
    color:"rgb(255,255,255)",     // Main color of the object
    wireframe: true
  });


var plane = new THREE.Mesh(planeGeometry, planeMaterial);
	plane.position.set(0.0, -150.0, 0.0);
	plane.rotateOnAxis(rotAxis,  angle );
scene.add(plane);



// // create a sphere
// var size = 40;
// var sphereGeometry = new THREE.SphereGeometry(50, 60, 60);
// var sphereMaterial = new THREE.MeshNormalMaterial();
// var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
// sphere.position.set(0.0, 0.0, -250.0);
// scene.add(sphere);



//-- Start main loop
renderer.setAnimationLoop( render );

function getIntersections( controller ) {

	tempMatrix.identity().extractRotation( controller.matrixWorld );

	raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
	raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

	return raycaster.intersectObjects( scene.children );

}

function onSelectStart( event ) {

	const controller = event.target;

	const intersections = getIntersections( controller );

	if ( intersections.length > 0 ) {

		const intersection = intersections[ 0 ];
		console.log(intersection.point);
		//cameraPosition = intersection.point;
		
		train.position.set(intersection.point.x, 1.60, intersection.point.z);

		// const object = intersection.object;
		// object.material.emissive.b = 1;
		// controller.attach( object );

		// controller.userData.selected = object;

	}

}

function onSelectEnd( event ) {

	const controller = event.target;

	if ( controller.userData.selected !== undefined ) {

		// const object = controller.userData.selected;
		// // object.material.emissive.b = 0;
		// // group.attach( object );

		// controller.userData.selected = undefined;

	}


}

function render() {
	renderer.render( scene, camera );
}