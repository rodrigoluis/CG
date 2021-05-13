import * as THREE 			from '../libs/other/three.module.r82.js';
import {RaytracingRenderer} from '../libs/other/raytracingRenderer.js';
import {degreesToRadians} 	from '../libs/util/util.js';

var scene = new THREE.Scene();    // Create main scene

// The canvas is in the XY plane.
// Hint: put the camera in the positive side of the Z axis and the
// objects in the negative side
var camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 10 );
	camera.position.z = 5;

var renderer = new RaytracingRenderer(window.innerWidth, window.innerHeight, 32, camera);
var container = document.createElement( 'div' );
	document.body.appendChild( container );
	container.appendChild( renderer.domElement );

// environment
var planeGeometry = new THREE.BoxGeometry( 10, .1, 5 );
var planeGeometry2 = new THREE.BoxGeometry( 10, .1, 10 );

// materials
var materialWall = new THREE.MeshLambertMaterial( {
	color: "rgb(200,160,100)",
} );

var materialFloor = new THREE.MeshLambertMaterial( {
	color: "rgb(180,180,180)",
} );

// back
var plane = new THREE.Mesh( planeGeometry, materialWall );
plane.rotation.x = 1.57;
plane.position.set( 0, 0, -10 );
scene.add( plane );

// bottom
var plane = new THREE.Mesh( planeGeometry2, materialFloor );
plane.position.set( 0, -2.5, -5 );
scene.add( plane );

// top
var plane = new THREE.Mesh( planeGeometry2, materialFloor );
plane.position.set( 0, 2.5, -5 );
scene.add( plane );

// left
var plane = new THREE.Mesh( planeGeometry, materialWall );
plane.rotation.z = 1.57;
plane.rotation.x = 1.57;
plane.position.set( -5, 0, -5 )
scene.add( plane );

// right
var plane = new THREE.Mesh( planeGeometry, materialWall );
plane.rotation.z = 1.57;
plane.rotation.x = 1.57;
plane.position.set( 5, 0, -5 )
scene.add( plane );

// Objects
var torusGeometry = new THREE.TorusGeometry(1, .2, 20, 20 );
var sphereGeometry = new THREE.SphereGeometry( 2, 20, 20 );
var boxGeometry = new THREE.BoxGeometry( 3,3,3 );

var phongMaterialAzulado = new THREE.MeshPhongMaterial( {
	color: "rgb(150,190,220)",
	specular: "rgb(255,255,255)",
	shininess: 200,
	} );

var phongMaterialAmarelo = new THREE.MeshPhongMaterial( {
	color: "rgb(255,170,0)",
	specular: "rgb(34,34,34)",
	shininess: 10000,
} );
phongMaterialAmarelo.mirror = true;
phongMaterialAmarelo.reflectivity = 0.7;

var mirrorMaterial = new THREE.MeshPhongMaterial( {
	color: "rgb(0,0,0)",
	specular: "rgb(255,255,255)",
	shininess: 1000,
} );
mirrorMaterial.mirror = true;
mirrorMaterial.reflectivity = 0.8;

var torus = new THREE.Mesh( torusGeometry, phongMaterialAzulado );
torus.rotation.y = degreesToRadians(40);
torus.position.set( -3, -1.3, -3 );
scene.add( torus );

var box = new THREE.Mesh( boxGeometry, mirrorMaterial );
box.position.set(0, -1.0, -5);
box.rotation.y = degreesToRadians(39);
scene.add( box );

var sphere = new THREE.Mesh( sphereGeometry, phongMaterialAmarelo );
sphere.scale.multiplyScalar( 0.5 );
sphere.position.set( 3, -1.5, -3 );
scene.add( sphere );

// light
var intensity = 0.3;
var light = new THREE.PointLight("rgb(255,255,255)", intensity );
light.position.set( -3, 0, 7 );
scene.add( light );

light = new THREE.PointLight( "rgb(255,255,255)", intensity );
light.position.set( 3, 0, 7 );
scene.add( light );

light = new THREE.PointLight( "rgb(255,255,255)", intensity );
light.position.set( 0, 5, 0 );
scene.add( light );

render();

function render()
{
	renderer.render( scene, camera );
}

