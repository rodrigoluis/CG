/*
NOT WORKING - UNDER DEVELOPMENT
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
	renderer.xr.setReferenceSpaceType( 'local' );

//-- Append renderer and create VR button -------------------------------------------------------
document.body.appendChild( renderer.domElement );
document.body.appendChild( VRButton.createButton( renderer ) );
window.addEventListener( 'resize', onWindowResize );

//-- Setting scene and camera -------------------------------------------------------------------
let scene = new THREE.Scene();
initDefaultLighting(scene, new THREE.Vector3(250, 40, 2));
let camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
camera.layers.enable( 1 );


// create the ground plane
var angle = degreesToRadians(-75);
var rotAxis = new THREE.Vector3(1,0,0); // Set Z axis
var planeGeometry = new THREE.PlaneGeometry(10000, 10000);
const texture2 = new THREE.TextureLoader().load("../assets/textures/sand.jpg");
var planeMaterial = new THREE.MeshBasicMaterial({map:texture2});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0.0, -205.0, -300.0);
plane.rotateOnAxis(rotAxis,  angle );
scene.add(plane);



// create a sphere
var size = 40;
var sphereGeometry = new THREE.SphereGeometry(50, 60, 60);
var sphereMaterial = new THREE.MeshNormalMaterial();
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0.0, 0.0, -250.0);
scene.add(sphere);


//-- Creating equirectangular Panomara ----------------------------------------------------------
// const geometry = new THREE.SphereGeometry( 500, 60, 60 );
// 	geometry.scale( - 1, 1, 1 ); // invert the geometry on the x-axis (faces will point inward)

// const texture = new THREE.TextureLoader().load( '../assets/textures/panorama.jpg' );
// const material = new THREE.MeshBasicMaterial( { map: texture } )
// const mesh = new THREE.Mesh( geometry, material );
// scene.add( mesh );


//-- Start main loop
renderer.setAnimationLoop( render );

function render() {
	renderer.render( scene, camera );
}