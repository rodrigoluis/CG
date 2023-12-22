import * as THREE from  'three';
import {OrbitControls} from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
		onWindowResize,
		initDefaultSpotlight} from "../libs/util/util.js";

import { CubeTextureLoaderSingleFile } from '../libs/util/cubeTextureLoaderSingleFile.js';

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

let cubeMapTexture = new CubeTextureLoaderSingleFile().loadSingle( 
   '../assets/textures/skybox/canyonCross.jpg', 1);
	cubeMapTexture.colorSpace = THREE.SRGBColorSpace;

   // Create the main scene and Set its background as a cubemap (using a CubeTexture)
scene.background = cubeMapTexture;

render();

//-- Functions -------------------------------------------------------------------------------
function render() {
	requestAnimationFrame( render );
	renderer.render( scene, camera );
}

