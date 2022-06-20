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
var camera = initCamera(new THREE.Vector3(10, 10, 10)); // Init camera in this position
var light = initDefaultSpotlight(scene, new THREE.Vector3(0, 0, 30)); // Use default light

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// Create the cube
let loader = new THREE.TextureLoader();
let geometry = new THREE.BoxGeometry(10, 5, 5).toNonIndexed();
let cubeMaterials = [
    setMaterial(null,'../assets/textures/crate.jpg', 2, 2), //x+
    setMaterial('orange','../assets/textures/paper.png'), //x-
    setMaterial(null,'../assets/textures/grass.jpg',2,1), //y+
    setMaterial('rgb(100,100,255)'), //y-
    setMaterial(null, '../assets/textures/stone.jpg',2,1), //z+
    setMaterial(null, '../assets/textures/marble.png',2,1) //z-
];
let cube = new THREE.Mesh(geometry, cubeMaterials);
scene.add(cube);

render();

// Function to set basic material or textures
// You can set just a color, just a texture or both
function setMaterial(color, file = null, repeatU = 1, repeatV = 1){
  if(!color) color = 'rgb(255,255,255)';

  let mat;
  if(!file){
    mat = new THREE.MeshBasicMaterial ({color:color});
  } else {
    mat = new THREE.MeshBasicMaterial({ map: loader.load(file),color:color});
    mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
    mat.map.minFilter = mat.map.magFilter = THREE.LinearFilter;
    mat.map.repeat.set(repeatU,repeatV); 
  }
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
