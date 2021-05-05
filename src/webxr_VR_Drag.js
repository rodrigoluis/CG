//-- Imports -------------------------------------------------------------------------------------
import * as THREE from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import {onWindowResize} from "../libs/util/util.js";

//-----------------------------------------------------------------------------------------------
//-- MAIN SCRIPT --------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------

//--  General globals ---------------------------------------------------------------------------
let raycaster = new THREE.Raycaster();	// Raycaster to enable selection and dragging
let group = new THREE.Group(); 			// Objects of the scene will be added in this group
const intersected = [];					// will be used to help controlling the intersected objects
window.addEventListener( 'resize', onWindowResize );

//-- Renderer and html settings ------------------------------------------------------------------
let renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor(new THREE.Color("rgb(70, 150, 240)"));
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
	renderer.xr.enabled = true;

//-- Setting scene and camera --------------------------------------------------------------------
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 30 );

//-- Create VR button and settings ---------------------------------------------------------------
document.body.appendChild( VRButton.createButton( renderer ) );

// controllers
let controller1 = renderer.xr.getController( 0 );
controller1.addEventListener( 'selectstart', onSelectStart );
controller1.addEventListener( 'selectend', onSelectEnd );
scene.add( controller1 );

// VR Camera Rectile
var ringGeo = new THREE.RingGeometry( .015, .030, 32 );
var ringMat = new THREE.MeshBasicMaterial( {
	color:"rgb(255,255,0)", 
	opacity: 0.9, 
	transparent: true } );
var rectile = new THREE.Mesh( ringGeo, ringMat );
 	rectile.position.set(0, 0, -1);
controller1.add( rectile );

//-- Creating Scene and calling the main loop ----------------------------------------------------
createScene();
animate();


//------------------------------------------------------------------------------------------------
//-- FUNCTIONS -----------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------

function onSelectStart( event ) {
	const controller = event.target;
	const intersections = getIntersections( controller );

	if ( intersections.length > 0 ) {
		const intersection = intersections[ 0 ];
		const object = intersection.object;
		object.material.emissive.b = 1;
		controller.attach( object );
		controller.userData.selected = object;
	}
}

function onSelectEnd( event ) {
	const controller = event.target;
	if ( controller.userData.selected !== undefined ) {
		const object = controller.userData.selected;
		object.material.emissive.b = 0;
		group.attach( object );
		controller.userData.selected = undefined;
	}
}

function getIntersections( controller ) {
	const tempMatrix = new THREE.Matrix4();	
	tempMatrix.identity().extractRotation( controller.matrixWorld );
	raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
	raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );
	return raycaster.intersectObjects( group.children );
}

function intersectObjects( controller ) {
	// Do not highlight when already selected
	if ( controller.userData.selected !== undefined ) return;

	const intersections = getIntersections( controller );

	if ( intersections.length > 0 ) {
		const intersection = intersections[ 0 ];
		const object = intersection.object;
		object.material.emissive.r = 1;
		intersected.push( object );
	} 
}

function cleanIntersected() {
	while ( intersected.length ) {
		const object = intersected.pop();
		object.material.emissive.r = 0;
	}
}

function animate() {
	renderer.setAnimationLoop( render );
}

function render() {
	cleanIntersected();
	intersectObjects( controller1 );
	renderer.render( scene, camera );
}

//-- Auxiliary Scene Creation function
function createScene()
{
	const light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 6, 0 );
	light.castShadow = true;
	light.shadow.mapSize.set( 4096, 4096 );
	scene.add( light );

	scene.add( new THREE.HemisphereLight( 0x808080, 0x606060 ) );

	const floorGeometry = new THREE.PlaneGeometry( 10, 10 );
	const floorMaterial = new THREE.MeshStandardMaterial( {
		color: 0xeeeeee,
		roughness: 1.0,
		metalness: 0.0
	} );
	const floor = new THREE.Mesh( floorGeometry, floorMaterial );
	floor.rotation.x = -Math.PI / 2;
	floor.receiveShadow = true;
	scene.add( floor );

	const geometries = [
		new THREE.BoxGeometry( 0.2, 0.2, 0.2 ),
		new THREE.ConeGeometry( 0.2, 0.2, 64 ),
		new THREE.CylinderGeometry( 0.2, 0.2, 0.2, 64 ),
		new THREE.TorusGeometry( 0.2, 0.04, 64, 32 )
	];
	
	const range = 8;
	for ( let i = 0; i < 50; i ++ ) {
	
		const geometry = geometries[ Math.floor( Math.random() * geometries.length ) ];
		const material = new THREE.MeshPhongMaterial( {
			color: Math.random() * 0xffffff
		} );
	
		const object = new THREE.Mesh( geometry, material );
	
		object.position.x = Math.random() * range - range/2;
		object.position.y = Math.random() * range/4.0;
		object.position.z = Math.random() * range - range/2;
	
		object.rotation.x = Math.random() * 2 * Math.PI;
		object.rotation.y = Math.random() * 2 * Math.PI;
		object.rotation.z = Math.random() * 2 * Math.PI;
	
		object.scale.setScalar( Math.random() + 0.5 );
	
		object.castShadow = true;
		object.receiveShadow = true;
	
		group.add( object );
	}	
	scene.add( group );
}
