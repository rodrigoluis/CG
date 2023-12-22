import * as THREE from  'three';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import {initRenderer, 
        createGroundPlane,
        onWindowResize} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 42)");

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.5, 2.0, 4.5);
  camera.up.set( 0, 1, 0 );

var ambientLight = new THREE.AmbientLight("rgb(100, 100, 100)");
scene.add(ambientLight);

var lightPosition = new THREE.Vector3(2.5, 1.8, 0.0);
  var light = new THREE.SpotLight(0xffffff);
  light.position.copy(lightPosition);
  light.castShadow = true;
  light.penumbra = 0.5;    
scene.add(light);

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 1.5 );
  axesHelper.visible = false;
scene.add( axesHelper );

//-- Scene Objects -----------------------------------------------------------
// Ground
var groundPlane = createGroundPlane(5.0, 5.0, 100, 100); // width and height
  groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Cube
var textureLoader = new THREE.TextureLoader();
var stone = textureLoader.load('../assets/textures/stone.jpg');

var cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
var cubeMaterial = new THREE.MeshLambertMaterial();
   cubeMaterial.map = stone;
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(0.0, 0.25, 1.0);
  scene.add(cube);

render();


function render()
{
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
