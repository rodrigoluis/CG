import * as THREE from  '../build/three.module.js';
import {initRenderer,
       initCamera} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(1, 15, 15)); // Init camera in this position

// create a cube
var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
var cubeMaterial = new THREE.MeshNormalMaterial();
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);

render();
function render()
{
    requestAnimationFrame(render);
    renderer.render(scene, camera) // Render scene
}
