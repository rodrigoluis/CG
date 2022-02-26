
import * as THREE from 'three';
// import GUI from '../libs/util/dat.gui.module.js'
// import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
  initDefaultBasicLight,
        initCamera,
        createGroundPlane,
        // onWindowResize, 
        degreesToRadians} from "../libs/util/util.js";




import Stats from '../build/jsm/libs/stats.module.js';

import { GUI } from '../build/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { Water } from '../build/jsm/objects/Water.js';
import { Sky } from '../build/jsm/objects/Sky.js';

let container, stats;
let camera;
let controls, water, sun, mesh;

let scene    = new THREE.Scene();    // Create main scene
let renderer = initRenderer(); 


//-- CREATING THE EQUIRECTANGULAR MAP ---------------------------------------------------------------------
const textureLoader = new THREE.TextureLoader();
let textureEquirec = textureLoader.load( '../assets/textures/panorama5.jpg' );
	textureEquirec.mapping = THREE.EquirectangularReflectionMapping; // Reflection as default
	textureEquirec.encoding = THREE.sRGBEncoding;
// Set scene's background as a equirectangular map
scene.background = textureEquirec

camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
camera.position.set( -100, 10, 34 );

let light    = initDefaultBasicLight(scene); 
  light.position.set(camera.position);

//

// sun = new THREE.Vector3();

// Water

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

water = new Water(
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
    fog: scene.fog !== undefined
  }
);

water.rotation.x = - Math.PI / 2;

scene.add( water );

// Skybox

// const sky = new Sky();
// sky.scale.setScalar( 10000 );
// scene.add( sky );

// const skyUniforms = sky.material.uniforms;

// skyUniforms[ 'turbidity' ].value = 10;
// skyUniforms[ 'rayleigh' ].value = 2;
// skyUniforms[ 'mieCoefficient' ].value = 0.005;
// skyUniforms[ 'mieDirectionalG' ].value = 0.8;

// const parameters = {
//   elevation: 2,
//   azimuth: 180
// };

// const pmremGenerator = new THREE.PMREMGenerator( renderer );

// function updateSun() {

//   const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
//   const theta = THREE.MathUtils.degToRad( parameters.azimuth );

//   sun.setFromSphericalCoords( 1, phi, theta );

//   sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
//   water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

//   scene.environment = pmremGenerator.fromScene( sky ).texture;

// }

// updateSun();

//

const geometry = new THREE.BoxGeometry( 30, 30, 30 );
const material = new THREE.MeshStandardMaterial( { roughness: 0 } );

mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

//

controls = new OrbitControls( camera, renderer.domElement );
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set( 0, 10, 0 );
controls.minDistance = 40.0;
controls.maxDistance = 200.0;
controls.update();

//

stats = new Stats();
// container.appendChild( stats.dom );

// GUI

const gui = new GUI();

// const folderSky = gui.addFolder( 'Sky' );
// folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
// folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
// folderSky.open();

const waterUniforms = water.material.uniforms;

const folderWater = gui.addFolder( 'Water' );
folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
folderWater.open();

//

window.addEventListener( 'resize', onWindowResize );



animate();

function init() {

  

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

  requestAnimationFrame( animate );
  render();
  stats.update();

}

function render() {

  const time = performance.now() * 0.001;

  mesh.position.y = Math.sin( time ) * 20 + 5;
  mesh.rotation.x = time * 0.5;
  mesh.rotation.z = time * 0.51;

  water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

  renderer.render( scene, camera );
  console.log(camera.position);

}