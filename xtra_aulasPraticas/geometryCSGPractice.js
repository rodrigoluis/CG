import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer,
        initCamera, 
        initDefaultBasicLight,
        createGroundPlane,
        onWindowResize} from "../libs/util/util.js";

import { CSG } from '../libs/other/CSGMesh.js'        

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information

var renderer = initRenderer();    // View function in util/utils
renderer.setClearColor("rgb(30, 30, 40)");
var camera = initCamera(new THREE.Vector3(4, -8, 8)); // Init camera in this position
   camera.up.set( 0, 0, 1 );

window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );
initDefaultBasicLight(scene, true, new THREE.Vector3(12, -15, 20), 28, 1024) ;	

var groundPlane = createGroundPlane(20, 20); // width and height (x, y)
scene.add(groundPlane);

var trackballControls = new TrackballControls( camera, renderer.domElement );
   
// Base objects
let cubeMesh = new THREE.Mesh(
   new THREE.BoxGeometry(2, 2, 2))
let sphereMesh = new THREE.Mesh( 
   new THREE.SphereGeometry(1.45, 20, 20) )

// CSG holders
let csgObject, cubeCSG, sphereCSG, cylinderCSG, torusCSG

// Object 1 - Cube SUBTRACT Sphere
sphereMesh.position.set(1, -0.5, 0.5)
   sphereMesh.matrixAutoUpdate = false;
   sphereMesh.updateMatrix();
sphereCSG = CSG.fromMesh(sphereMesh)  
cubeCSG = CSG.fromMesh(cubeMesh)   
csgObject = cubeCSG.subtract(sphereCSG)
let mesh1 = CSG.toMesh(csgObject, new THREE.Matrix4())
mesh1.material = new THREE.MeshPhongMaterial(
   {color: 'lightblue'})
mesh1.position.set(0, 0, 1.02)
scene.add(mesh1)


render();

function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
