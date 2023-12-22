import * as THREE from  'three';
import KeyboardState from '../libs/util/KeyboardState.js'
import {initRenderer, 
        initCamera, 
        initDefaultSpotlight,
        onWindowResize} from "../libs/util/util.js";

var scene, renderer, camera, light, keyboard;
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // View function in util/utils
camera = initCamera(new THREE.Vector3(0, 0, 10)); // Init camera in this position
light = initDefaultSpotlight(scene, new THREE.Vector3(0, 0, 20)); // Use default light
keyboard = new KeyboardState();

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
//scene.add( axesHelper );

// Create the cube
let loader = new THREE.TextureLoader();
let geometry = new THREE.BoxGeometry(5, 5, 0.5);
let cubeMaterials = [
   setMaterial('../assets/textures/NormalMapping/crossSide.png'), //x+
   setMaterial('../assets/textures/NormalMapping/crossSide.png'), //x-
   setMaterial('../assets/textures/NormalMapping/crossTop.png'), //y+
   setMaterial('../assets/textures/NormalMapping/crossTop.png'), //y-
   setMaterial('../assets/textures/NormalMapping/cross.png', 
               '../assets/textures/NormalMapping/crossNormal.png'), //z+
   setMaterial('../assets/textures/NormalMapping/cross.png', 
               '../assets/textures/NormalMapping/crossNormal.png')  //z-
];
let cube = new THREE.Mesh(geometry, cubeMaterials);
scene.add(cube);

render();

function keyboardUpdate() {
   keyboard.update();
   let angle = THREE.MathUtils.degToRad(0.5);   
   if ( keyboard.pressed("A") ) cube.rotateY(angle);
   if ( keyboard.pressed("D") ) cube.rotateY(-angle);   
   if ( keyboard.pressed("W") ) cube.rotateX(angle);
   if ( keyboard.pressed("S") ) cube.rotateX(-angle);   
 }

// Function to set a texture
function setMaterial(file, normalMapFile = null){
   let normalMap = null;
   if(normalMapFile) normalMap = loader.load(normalMapFile) 
   let mat = new THREE.MeshPhongMaterial({  
        map: loader.load(file),
        normalMap: normalMap,
        normalScale: new THREE.Vector2(1, 1),
      });
   return mat;
}

function render()
{
  keyboardUpdate();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
