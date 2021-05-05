//-- Imports -------------------------------------------------------------------------------------
import * as THREE from '../build/three.module.js';
import { VRButton } from '../build/jsm/webxr/VRButton.js';
import {onWindowResize} from "../libs/util/util.js";

//------------------------------------------------------------------------------------------------
//-- MAIN SCRIPT ---------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------

//--  General globals ----------------------------------------------------------------------------
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
let camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 20 );

//-- Font loader ---------------------------------------------------------------------------------
const fontLoader = new THREE.FontLoader();
let fontGeometry = null;

//-- Create VR button and settings ---------------------------------------------------------------
document.body.appendChild( VRButton.createButton( renderer ) );

// controllers
let controller1 = renderer.xr.getController( 0 );
	controller1.addEventListener( 'selectstart', onSelectStart );
	controller1.addEventListener( 'selectend', onSelectEnd );
scene.add( controller1 );

// VR Camera Rectile 
var ringGeo = new THREE.RingGeometry( .04, .08, 32 );
var ringMat = new THREE.MeshBasicMaterial( {
	color:"rgb(255,255,0)", 
	opacity: 0.9, 
	transparent: true } );
var rectile = new THREE.Mesh( ringGeo, ringMat );
 	rectile.position.set(0, 0, -2.5);
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
		changeFont(object.name + " selected"); // This function add text on a specific position in the VR environment
		controller.userData.selected = object;
		controller.attach( object );
	}
}

function onSelectEnd( event ) {
	const controller = event.target;
	if ( controller.userData.selected !== undefined ) {
		const object = controller.userData.selected;
		object.material.emissive.b = 0;
		group.attach( object );
		controller.userData.selected = undefined;
		if(fontGeometry) 
		{
			// Deleting fontGeometry and removing from the scene
			fontGeometry.geometry.dispose();
			fontGeometry.material.dispose();
			scene.remove(fontGeometry);
		}
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

//
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
	const light = new THREE.PointLight( "rgb(255, 255, 255)" );
		light.position.set( 0, 10, 3 );
		light.castShadow = true;
		light.shadow.mapSize.width = 1024; // default
		light.shadow.mapSize.height = 1024; // default
	scene.add( light );

	scene.add( new THREE.HemisphereLight( "rgb(80, 80, 80)" ) );

	const floorGeometry = new THREE.PlaneGeometry( 20, 20 );
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
		new THREE.TorusGeometry( 0.2, 0.04, 64, 32 ),
		new THREE.BoxGeometry( 0.2, 0.2, 0.2 )		
	];

	for ( let i = 0; i < 5; i ++ ) {
	
		const geometry = geometries[i];
		const material = new THREE.MeshPhongMaterial( {color: Math.random() * 0xffffff} );
	
		let id = i+1;
		const object = new THREE.Mesh( geometry, material );
			object.name = "Object " + id;
	
		object.position.x = i * 2 - 4;
		object.position.y = 2;
		object.position.z = -4;
		object.scale.setScalar( 4.0 );
	
		object.castShadow = true;
		object.receiveShadow = true;
	
		group.add( object );
	}		
	scene.add( group );
}

//-- Function to create and render the text in the VR environment --------------------------------
function changeFont(message)
{
	if(fontGeometry) scene.remove( fontGeometry );
	fontLoader.load( '../assets/fonts/helvetiker_regular.typeface.json', function ( font ) 
	{
		const matLite = new THREE.MeshBasicMaterial( { color: "rgb(0, 0, 255)" } );
		const shapes = font.generateShapes( message, 0.1 );

		const geometry = new THREE.ShapeGeometry( shapes );
		// Compute bounding box to help centralize the text
		geometry.computeBoundingBox();
		const xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
		geometry.translate( xMid, 2, 0 );

		fontGeometry = new THREE.Mesh( geometry, matLite );
		fontGeometry.position.set(0, -1, - 2);
		scene.add( fontGeometry );
	} );	
}