import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import {OrbitControls} from '../build/jsm/controls/OrbitControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
		onWindowResize,
		initDefaultSpotlight,
		lightFollowingCamera} from "../libs/util/util.js";

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
let cubeMapTexture = new THREE.CubeTextureLoader().load( urls );

// Create the main scene and Set its background as a cubemap (using a CubeTexture)
scene.background = cubeMapTexture;

// Create the main object (teapot)
let geometry = new TeapotGeometry(1);
let teapotMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: cubeMapTexture, refractionRatio: 0.95 } );
let teapot = new THREE.Mesh(geometry, teapotMaterial);
scene.add(teapot);	

buildInterface();
render();

//-- Functions -------------------------------------------------------------------------------
function render() {
	lightFollowingCamera(light, camera);
	requestAnimationFrame( render );
	renderer.render( scene, camera );
}

function buildInterface()
{
  var controls = new function ()
  {
    this.refraction = false;
    this.onSetRefraction = function(){
		if(this.refraction)
			cubeMapTexture.mapping = THREE.CubeRefractionMapping;		
		else
			cubeMapTexture.mapping = THREE.CubeReflectionMapping;
		teapotMaterial.needsUpdate = true;
    };
  };
  var gui = new GUI();
  gui.add(controls, 'refraction', false)
    .name("Refraction")
    .onChange(function(e) { controls.onSetRefraction() });
}