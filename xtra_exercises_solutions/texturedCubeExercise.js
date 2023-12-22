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

var renderer = initRenderer('white');    // View function in util/utils
var camera = initCamera(new THREE.Vector3(10, 10, 10)); // Init camera in this position
var light = initDefaultSpotlight(scene, new THREE.Vector3(0, 0, 30)); // Use default light

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
//scene.add( axesHelper );

// Create the cube
let loader = new THREE.TextureLoader();

let geometry = new THREE.BoxGeometry(5, 5, 5);
let offsetx = 0.33;
let offsety = 0.33;
let cubeMaterials = [
    setMaterial(.000, .000, offsetx, offsety), //x+
    setMaterial(.000, .335, offsetx, offsety), //x-
    setMaterial(.000, .670, offsetx, offsety), //y+
    setMaterial(.335, .000, offsetx, offsety), //y-
    setMaterial(.335, .335, offsetx, offsety), //z+
    setMaterial(.335, .670, offsetx, offsety) //z-
];
let cube = new THREE.Mesh(geometry, cubeMaterials);
scene.add(cube);

render();

// Function to set basic material or textures
// You can set just a color, just a texture or both
function setMaterial(offx = null, offy = null, repeatx = null, repeaty = null){
   let material = new THREE.MeshBasicMaterial ();   
   let texture = loader.load('../assets/textures/tiles.jpg');   
   material.map = texture;
   material.map.wrapS = THREE.RepeatWrapping;
   material.map.wrapT = THREE.RepeatWrapping;   
   material.map.repeat.x = repeatx;
   material.map.repeat.y = repeaty;   
   material.map.offset.x = offx;
   material.map.offset.y = offy;   
//   material.map.needsUpdate = true;

   return material;
}

function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  lightFollowingCamera(light, camera) // Makes light follow the camera
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}




