import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { initRenderer,
         setDefaultMaterial,
         SecondaryBox,
         initDefaultBasicLight,
         onWindowResize,
         lightFollowingCamera
} from "../libs/util/util.js";

let scene, renderer, light; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // View function in util/utils
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

createSceneObjects();

//-----------------------------------------------------------
//-- Create cameras -----------------------------------------
//-----------------------------------------------------------
let orthoSize = 20; // Estimated size for orthographic projection
let w = window.innerWidth;
let h = window.innerHeight
let aspect = w / h;
let near = 0.1;
let far = 1000;
let fov = 40;
let position = new THREE.Vector3(0,  0, 30);
let lookat   = new THREE.Vector3(0,  0,  0);
let up       = new THREE.Vector3(0,  1,  0);

// Create perspective camera
let cameraPerspective = new THREE.PerspectiveCamera(fov, aspect, near, far); // fov, aspect, near, far

// Create orthographic camera
let cameraOrtho = new THREE.OrthographicCamera(-orthoSize * aspect / 2, orthoSize * aspect / 2, // left, right
                                                orthoSize / 2, -orthoSize / 2,                  // top, bottom
                                                near, far);                                     // near, far

// Set perspective camera as default, and sets its position and lookat
let camera = cameraPerspective;
camera.position.copy(position);
camera.up.copy(up);
camera.lookAt(lookat); // or camera.lookAt(0, 0, 0);
let projectionMessage = new SecondaryBox("Perspective Projection");
window.addEventListener('resize', function () { onWindowResize(camera, renderer, orthoSize) }, false);

// Set one orbit control per camera
let orbitP, orbitO;
orbitP = new OrbitControls( cameraPerspective, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.
orbitO = new OrbitControls( cameraOrtho, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.
// Zoom and pan are disabled because each camera type works differently
orbitP.enableZoom = orbitO.enableZoom = false;
orbitP.enablePan = orbitO.enablePan = false; 


buildInterface();
render();

function changeProjection() {
   // Store the previous position of the camera
   let pos = new THREE.Vector3().copy(camera.position);
   let up = new THREE.Vector3().copy(camera.up);

   if (camera instanceof THREE.PerspectiveCamera) {
      camera = cameraOrtho;
      projectionMessage.changeMessage("Orthographic");
   } else {
      camera = cameraPerspective;
   
      projectionMessage.changeMessage("Perspective");
   }
   
   onWindowResize(camera, renderer, orthoSize)  
   camera.position.copy(pos);
   camera.up.copy(up);
   camera.lookAt(scene.position);
}

function buildInterface() {
   var controls = new function () {
      this.onChangeProjection = function () {
         changeProjection();
      };
   };

   // GUI interface
   var gui = new GUI();
   gui.add(controls, 'onChangeProjection').name("Change Projection");
}

function render() {
   lightFollowingCamera(light, camera) // Makes light follow the camera
   requestAnimationFrame(render); // Show events
   renderer.render(scene, camera) // Render scene
}

//-----------------------------------------------------------
//-- Auxiliary functions ------------------------------------
//-----------------------------------------------------------
function createSceneObjects() {
   let sphere = new THREE.Mesh(
      new THREE.SphereGeometry(2, 50, 50),
      setDefaultMaterial("rgb(255,255,255)")
   );
   sphere.position.set(0, 0, 5);
   scene.add(sphere);

   // create a wireframe cube
   scene.add(new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 10),
      new THREE.MeshBasicMaterial({ wireframe: true })
   ));

   // create the inner cube
   scene.add(new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      setDefaultMaterial("rgb(70,110,130)")
   ));

   scene.add(new THREE.AxesHelper(12));  
}
