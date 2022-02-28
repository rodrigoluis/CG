
import * as THREE from 'three';
import { GUI } from '../build/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initDefaultBasicLight,
        initCamera,
        onWindowResize} from "../libs/util/util.js";     
import { Water } from '../build/jsm/objects/Water.js';  // Water shader in here

//-- Main script ----------------------------------------------------------------------------------
let scene     = new THREE.Scene();    // Create main scene
let renderer  = initRenderer(); 
let camera    = initCamera(new THREE.Vector3(-5, 0, 3));
initDefaultBasicLight(scene, false, camera.position);
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

let controls = new OrbitControls( camera, renderer.domElement );
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set( 0, 3, 0 );
controls.minDistance = 15.0;
controls.maxDistance = 100.0;
controls.update();

//-- Create background ----------------------------------------------------------------------------
const textureLoader = new THREE.TextureLoader();
let textureEquirec = textureLoader.load( '../assets/textures/panorama5.jpg' );
	textureEquirec.mapping = THREE.EquirectangularReflectionMapping; 
	textureEquirec.encoding = THREE.sRGBEncoding;
scene.background = textureEquirec


//-- SET WATER SHADER -----------------------------------------------------------------------------
const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

// Water shader parameters
let water = new Water(
  waterGeometry,
  {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load( '../assets/textures/waternormals.jpg', function ( texture ) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    } ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
  }
);
water.rotation.x = - Math.PI / 2;
scene.add( water );

//-- Cube -----------------------------------------------------------------------------------------
let cube = new THREE.Mesh( 
  new THREE.BoxGeometry( 3, 3, 3 ), // geometry
  new THREE.MeshStandardMaterial( { color:"lightsalmon" } ) ); // material
scene.add( cube );

buildInterface();
render();

//-- Functions ------------------------------------------------------------------------------------

function buildInterface() {
  const gui = new GUI();

  const waterUniforms = water.material.uniforms;
  gui.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
  gui.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
  gui.open();
}

function render() {
  const time = performance.now() * 0.001;

  cube.position.y = Math.sin( time ) * 2;
  cube.rotation.x = time * 0.5;
  cube.rotation.z = time * 0.51;

  water.material.uniforms[ 'time' ].value += 0.01;

  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}