import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        onWindowResize,
        createGroundPlaneWired} from "../libs/util/util.js";

import Fire from '../libs/util/shaders/fire.js'

let scene, renderer, camera, light, orbit; // Initial variables
var clock = new THREE.Clock();;

scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(2, 4, 5)); // Init camera in this position
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
light = initDefaultBasicLight(scene, true, new THREE.Vector3(25, 30, 20))
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// create the ground plane
let plane = createGroundPlaneWired(7, 7, 7, 7, 3, "darkseagreen", "darkolivegreen")
scene.add(plane);

// Building the scene
// create a cube
let cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
let cube = new THREE.Mesh(cubeGeometry, setDefaultMaterial("darkgreen")); 
   cube.position.set(0.0, 0.5, 0.0);
   cube.castShadow = true;
scene.add(cube);

let loader = new THREE.TextureLoader();

let fireTex = loader.load("../assets/textures/fire.png");
let fire = new Fire(fireTex);
   fire.scale.set(1.0, 3.0, 1.0)
   fire.position.set(0.0, 2.5, 0.0)
scene.add(fire);

render();

function render()
{
  requestAnimationFrame(render);
  fire.update(clock); // Update fire animation
  renderer.render(scene, camera) // Render scene
}
