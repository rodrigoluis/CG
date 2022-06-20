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

//-- CREATING THE EQUIRECTANGULAR MAP ---------------------------------------------------------------------
const textureLoader = new THREE.TextureLoader();
let textureEquirec = textureLoader.load( '../assets/textures/panorama4.jpg' );
	textureEquirec.mapping = THREE.EquirectangularReflectionMapping; // Reflection as default
	textureEquirec.encoding = THREE.sRGBEncoding;
// Set scene's background as a equirectangular map
scene.background = textureEquirec;

// Create the main object (teapot)
let geometry = new TeapotGeometry(1);
let material = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: textureEquirec, refractionRatio: 0.95 } );
let teapot = new THREE.Mesh(geometry, material);
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
			textureEquirec.mapping = THREE.EquirectangularRefractionMapping;		
		else
			textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
		material.needsUpdate = true;
    };
  };
  var gui = new GUI();
  gui.add(controls, 'refraction', false)
    .name("Refraction")
    .onChange(function(e) { controls.onSetRefraction() });
}
