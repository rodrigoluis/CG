import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        setDefaultMaterial, 
        onWindowResize, 
        initDefaultBasicLight} from "../libs/util/util.js";

        
var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
var material = setDefaultMaterial("lightgreen"); // create a basic material
var camera = initCamera(new THREE.Vector3(0, 0, 7)); // Init camera in this position
let orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.
initDefaultBasicLight(scene);

// create a cube
let cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
let cube = new THREE.Mesh(cubeGeometry, material);
   scene.add(cube);

cube.matrixAutoUpdate = false;
cube.matrix.identity();
let mat4 = new THREE.Matrix4();
 
// Will execute T1 and then R1
cube.matrix.multiply(mat4.makeScale(2.5, 1, 0.5)) // S1
cube.matrix.multiply(mat4.makeRotationZ(THREE.MathUtils.degToRad(45))); // R1

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

render();


function render()
{
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
