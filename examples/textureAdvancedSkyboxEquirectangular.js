import * as THREE from  'three';
import {OrbitControls} from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
		onWindowResize,
		initDefaultSpotlight} from "../libs/util/util.js";

//-- MAIN SCRIPT -------------------------------------------------------------------------------
let scene = new THREE.Scene();    
let renderer = initRenderer();   
let camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 100 );
	camera.position.z = 7;

// Set lights
let light = initDefaultSpotlight(scene, camera.position);

// Controls and window management
new OrbitControls( camera, renderer.domElement );
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

//-- CREATING THE EQUIRECTANGULAR MAP ---------------------------------------------------------------------
const textureLoader = new THREE.TextureLoader();
let textureEquirec = textureLoader.load( '../assets/textures/skybox/panorama4.jpg' );
	textureEquirec.mapping = THREE.EquirectangularReflectionMapping; // Reflection as default
	textureEquirec.colorSpace = THREE.SRGBColorSpace;

// Set scene's background as a equirectangular map
scene.background = textureEquirec;

render();

//-- Functions -------------------------------------------------------------------------------
function render() {
	requestAnimationFrame( render );
	renderer.render( scene, camera );
}

