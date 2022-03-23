import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera, 
        initDefaultSpotlight,
        onWindowResize, 
        lightFollowingCamera} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information

var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(15, 15, 15)); // Init camera in this position
var light = initDefaultSpotlight(scene, new THREE.Vector3(0, 0, 30)); // Use default light

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the inner cube
var geometry = new THREE.BoxGeometry(10, 5, 5).toNonIndexed();
var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: true } );

var cube = new THREE.Mesh(geometry, material);
const loader = new THREE.TextureLoader();
const cubeMaterials = [
    setMaterial('../assets/textures/crate.jpg', 2, 2), //x+
    setMaterial('../assets/textures/paper.png',2,2), //x-
    setMaterial('../assets/textures/grass.jpg',2,1), //y+
    setMaterial('../assets/textures/granite.png',2,1), //y-
    setMaterial('../assets/textures/stone.jpg',2,1), //z+
    setMaterial('../assets/textures/marble.png',2,1) //z-
];

//create material, color, or image texture
cube = new THREE.Mesh(geometry, cubeMaterials);

// add the cube to the scene
scene.add(cube);

render();

function setMaterial(file, repeatU, repeatV){
  let mat = new THREE.MeshBasicMaterial({ map: loader.load(file)});
  mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
  mat.map.minFilter = mat.map.magFilter = THREE.LinearFilter;
  mat.map.repeat.set(repeatU,repeatV); 
  return mat;
}

function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  lightFollowingCamera(light, camera) // Makes light follow the camera
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
