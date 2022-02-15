import * as THREE from '../build/three.module.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {OrbitControls} from '../build/jsm/controls/OrbitControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
		InfoBox,
		onWindowResize,
		initDefaultSpotlight,
		lightFollowingCamera} from "../libs/util/util.js";

//-- MAIN SCRIPT -------------------------------------------------------------------------------
let scene = new THREE.Scene();    
let renderer = initRenderer();    // View function in util/utils
let camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 100 );
	camera.position.z = 7;

// Controls and window management
new OrbitControls( camera, renderer.domElement );
let keyboard = new KeyboardState();
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
showInformation();

//-- CREATING THE CUBE MAP ---------------------------------------------------------------------
// Setting the 6 textures of the cubemap
const path = '../assets/textures/cube/SaintPetersBasilica/';
const format = '.jpg';
const urls = [
	path + 'posx' + format, path + 'negx' + format,
	path + 'posy' + format, path + 'negy' + format,
	path + 'posz' + format, path + 'negz' + format
];
// Setting the two cube maps, one for refraction and one for reflection
const reflectionCube = new THREE.CubeTextureLoader().load( urls );
const refractionCube = new THREE.CubeTextureLoader().load( urls );
refractionCube.mapping = THREE.CubeRefractionMapping;

// Create the main scene and Set its background as a cubemap (using a CubeTexture)
scene.background = reflectionCube;

// Set lights
let light = initDefaultSpotlight(scene, camera.position); 

// Create reflective and refractive material
const cubeReflection = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: reflectionCube } );
const cubeRefraction = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: refractionCube, refractionRatio: 0.95 } );	

// Create two teapots, each with one material.
let teapotReflection = createTeapot(cubeReflection);
let teapotRefraction = createTeapot(cubeRefraction);
	teapotRefraction.visible = false; // Starts with the reflective teapot

render();

//-- Functions -------------------------------------------------------------------------------
function render() {
	keyboardUpdate();
	lightFollowingCamera(light, camera);
	requestAnimationFrame( render );
	renderer.render( scene, camera );
}

function createTeapot(material) {
	var geometry = new TeapotGeometry(1);
	var teapot = new THREE.Mesh(geometry, material);
	scene.add(teapot);		
	return teapot;
}

function keyboardUpdate() {
	keyboard.update();
	if ( keyboard.down("space") ) { 
		teapotReflection.visible = !teapotReflection.visible;
		teapotRefraction.visible = !teapotRefraction.visible;		
	}
}

function showInformation(){
  let controls = new InfoBox();
      controls.add("Cube Mapping");
      controls.addParagraph();
      controls.add("Press SPACE to toogle between reflection and refraction material.");
      controls.show();
}