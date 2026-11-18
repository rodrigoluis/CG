import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera, 
        initDefaultSpotlight,
        onWindowResize, 
        lightFollowingCamera} from "../libs/util/util.js";
import { TextureLoader } from '../build/three.core.js';

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

let loader = new THREE.TextureLoader()
var geo = new THREE.BoxGeometry(5, 5, 5);

var materials = [
    setMaterial('../assets/textures/tiles.jpg'), // +X (direita)
    setMaterial('../assets/textures/tiles.jpg'), // -X (esquerda)
    setMaterial('../assets/textures/tiles.jpg'), // +Y (cima)
    setMaterial('../assets/textures/tiles.jpg'), // -Y (baixo)
    setMaterial('../assets/textures/tiles.jpg'), // +Z (frente)
    setMaterial('../assets/textures/tiles.jpg')  // -Z (trás)
];

var cube = new THREE.Mesh(geo, materials);
scene.add(cube);


cube.material[0].map.offset.set(0, 0);    // +X
cube.material[1].map.offset.set(0.333, 0);  // -X
cube.material[2].map.offset.set(0, 0.333); // +Y
cube.material[3].map.offset.set(0.0, -0.333); // -Y
cube.material[4].map.offset.set(-0.333, 0); // +Z
cube.material[5].map.offset.set(-0.333, -0.333); // -Z

cube.material[0].map.repeat.set(0.333,0.333);
cube.material[1].map.repeat.set(0.333,0.333);
cube.material[2].map.repeat.set(0.333,0.333);
cube.material[3].map.repeat.set(0.333,0.333);
cube.material[4].map.repeat.set(0.333,0.333);
cube.material[5].map.repeat.set(0.333,0.333);

// To access textures individually, you should use their indexes
//console.log(cube.material[0].map)

render();

// Function to set a texture
function setMaterial(file, repeatU = 1, repeatV = 1, color = 'rgb(255,255,255)'){
   let mat = new THREE.MeshBasicMaterial({ map: loader.load(file), color:color});
      mat.map.colorSpace = THREE.SRGBColorSpace;
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
