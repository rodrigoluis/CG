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

let scene, renderer, camera, light, orbit;
scene = new THREE.Scene();    
scene.background = new THREE.Color(0xf0f0f0);
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(0, 5, 15)); 
light = initDefaultBasicLight(scene, true, new THREE.Vector3(25, 20, 15))
orbit = new OrbitControls( camera, renderer.domElement );

// Create auxiliary info box
let infoBox = new SecondaryBox("");

window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);
// Controls where user the clicks with the mouse
window.addEventListener('click', onMousePicking, false); 

// Create list of objects and ground plane
let objects = [];
let geometry = new THREE.BoxGeometry(2, 2, 2);
for (let i = 0; i < 3; i++) {
   var object = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff }));
   object.castShadow = object.receiveShadow = true;
   object.position.set(4 * i - 4, 0.91, 0);

   scene.add(object);
   objects.push(object); // Objects to be checked for selection
}
let selected = null; // Stores the selected object

let groundPlane = createGroundPlaneXZ(20, 20);
scene.add(groundPlane);

render();


//-- Functions --------------------------------------------------------------

// Use raycaster to pick the clicked object
function onMousePicking(event) 
{
   // calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
   let pointer = new THREE.Vector2();
   pointer.x =  (event.clientX / window.innerWidth) * 2 - 1;
   pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

   // -- Create and compute the raycaster -----------------------
   let raycaster = new THREE.Raycaster();
   // update the picking ray with the camera and pointer position
   raycaster.setFromCamera(pointer, camera);
   // calculate objects intersecting the picking ray
   let intersects = raycaster.intersectObjects(objects);
   
   // -- Find the selected objects ------------------------------
   if (intersects.length > 0) // Check if there is a intersection
   {      
      for (let i = 0; i < objects.length; i++)
      {
         // Deselect object when clicked again
         if(selected == objects[i] && 
            selected == intersects[0].object)
         {  
            clearSelected();
            infoBox.changeMessage("Cube deselected.");
            return;
         }         
         if(objects[i] == intersects[0].object ) {
            clearSelected();
            selected = objects[i];           
            selected.material.emissive.setRGB(0.25, 0.25, 0.25);
            infoBox.changeMessage("Cube " + (i+1) + " selected.");
         }
      }  
   }
};

function clearSelected() 
{
   selected = null;
   for (let i = 0; i < objects.length; i++)
      objects[i].material.emissive.setRGB(0, 0, 0);
}

function render() 
{
   requestAnimationFrame(render);
   renderer.render(scene, camera);
}
