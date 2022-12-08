import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
   initRenderer,
   initCamera,
   initDefaultBasicLight,
   SecondaryBox,
   createGroundPlaneXZ,
   onWindowResize
} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
scene.background = new THREE.Color(0xf0f0f0);
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(0, 5, 15)); // Init camera in this position
light = initDefaultBasicLight(scene, true, new THREE.Vector3(25, 20, 15))
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

let selected = null; // Stores the selected object

// Create auxiliary info box
let infoBox = new SecondaryBox("");

// Create list of objects and ground plane
let objects = [];
let groundPlane = createGroundPlaneXZ(20, 20);
scene.add(groundPlane);
var geometry = new THREE.BoxGeometry(2, 2, 2);
for (let i = 0; i < 3; i++) {
   var object = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff }));
   object.castShadow = object.receiveShadow = true;
   object.position.set(4 * i - 4, 0.91, 0);

   scene.add(object);
   objects.push(object); // Objects to be checked for selection
}

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);
window.addEventListener('click', onMouseSelectObject, false);

render();


//-- Functions --------------------------------------------------------------

function clearSelected() {
   selected = null;
   for (let i = 0; i < objects.length; i++)
      objects[i].material.emissive.setRGB(0, 0, 0);
}

function onMouseSelectObject(event) {
   let pointer = new THREE.Vector2();
   pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
   pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
   let raycaster = new THREE.Raycaster();
   raycaster.setFromCamera(pointer, camera);
   let intersects = raycaster.intersectObjects(objects);
   
   if (intersects.length > 0) // Check if there is a intersection
   {      
      for (let i = 0; i < objects.length; i++)
      {
         if(selected == objects[i] && selected == intersects[0].object)
         {  
            // Clear selection
            clearSelected();
            infoBox.changeMessage("Cube deselected.");
            return;
         }         
   
         if(objects[i] == intersects[0].object ) {
            clearSelected();
            selected = objects[i];
            let cubeNumber = i + 1;
            let e = 0.25;            
            selected.material.emissive.setRGB(e, e, e);
            infoBox.changeMessage("Cube " + cubeNumber + " selected.");
         }

      }  
   }
};

function render() {
   requestAnimationFrame(render);
   renderer.render(scene, camera);
}
