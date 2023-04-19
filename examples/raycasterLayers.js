import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import GUI from '../libs/util/dat.gui.module.js'
import {
   initRenderer,
   initCamera,
   initDefaultBasicLight,
   SecondaryBox,
   onWindowResize,
   lightFollowingCamera
} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit;
scene = new THREE.Scene();    
   scene.background = new THREE.Color("black"); //0xf0f0f0);
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(10, 10, 15)); 
light = initDefaultBasicLight(scene, true, new THREE.Vector3(25, 20, 15));
orbit = new OrbitControls( camera, renderer.domElement );

// Create auxiliary info box and listeners
let leftBox = new SecondaryBox("");
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);
window.addEventListener('mousemove', onMouseMove);

//-- RAYCASTER LAYERS ------------------------------------------------------

// -- Create raycaster
let raycaster = new THREE.Raycaster();

// Enable layers to raycaster and camera (layer 0 is enabled by default)
raycaster.layers.enable( 0 );
raycaster.layers.enable( 1 );
raycaster.layers.enable( 2 );            
camera.layers.enable( 0 );
camera.layers.enable( 1 );
camera.layers.enable( 2 );

// Create list of plane objects 
let objects = [];
let plane, planeGeometry, planeMaterial;
for (let i = 0; i < 3; i++) {
   planeGeometry = new THREE.PlaneGeometry(7, 7, 20, 20);
   planeMaterial = new THREE.MeshLambertMaterial();
   planeMaterial.side = THREE.DoubleSide;
   planeMaterial.transparent = true;
   planeMaterial.opacity = 0.8;
   plane = new THREE.Mesh(planeGeometry, planeMaterial);
   scene.add(plane);
   objects.push(plane); // List of objects to be checked by raycaster
}

// Change plane's layer, position and color
let colors = ["red", "green", "blue", "white"];
for (let i = 0; i < 3; i++) {
   plane = objects[i]; // Get plane from object list
   plane.translateZ(-i*6 + 6); // change position
   plane.layers.set(i);  // change layer
   plane.material.color.set(colors[i]); // change color
}


// Object to represent the intersection point
let intersectionSphere = new THREE.Mesh(
   new THREE.SphereGeometry(.2, 30, 30, 0, Math.PI * 2, 0, Math.PI),
   new THREE.MeshPhongMaterial({color:"orange", shininess:"200"}));
scene.add(intersectionSphere);

buildInterface();
render();


//-- Functions --------------------------------------------------------------

function render() 
{
   requestAnimationFrame(render);
   lightFollowingCamera(light, camera);   
   renderer.render(scene, camera);
}

// Use raycaster to intersect planes
function onMouseMove(event) 
{
   leftBox.changeMessage("Intersection: None");
   intersectionSphere.visible = false;
   // calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
   let pointer = new THREE.Vector2();
   pointer.x =  (event.clientX / window.innerWidth) * 2 - 1;
   pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

   // update the picking ray with the camera and pointer position
   raycaster.setFromCamera(pointer, camera);
   // calculate objects intersecting the picking ray
   let intersects = raycaster.intersectObjects(objects);
   
   // -- Find the selected objects ------------------------------
   if (intersects.length > 0) // Check if there is a intersection
   {      
      let point = intersects[0].point; // Pick the point where interception occurrs
      intersectionSphere.visible = true;
      intersectionSphere.position.set(point.x, point.y, point.z);
      
      for (let i = 0; i < objects.length; i++)
      {   
         if(objects[i] == intersects[0].object ) {
            clearSelected(); // Removes emissive for all layers 
            objects[i].material.emissive.setRGB(0.4, 0.4, 0.4);
            showInterceptionCoords(i, point);
         }
      }
   }
};

function clearSelected() 
{
   for (let i = 0; i < objects.length; i++)
      objects[i].material.emissive.setRGB(0, 0, 0);
}

function showInterceptionCoords(layer, point)
{
   leftBox.changeMessage("Intersection on Layer " + layer + "  [" +  
       point.x.toFixed(2) + ", " +
       point.y.toFixed(2) + ", " + 
       point.z.toFixed(2) + "]"); 
}

function buildInterface()
{
  var controls = new function ()
  {
    this.layer0 = true;
    this.layer1 = true;
    this.layer2 = true;

    this.enableLayer = function(layer){
      // If layer is deselected and is previously enabled, 
      // change color, opacity and disable the layer on the raycaster
      if(raycaster.layers.isEnabled( layer ))
      {
         objects[layer].material.color.set(colors[3]); // White 
         objects[layer].material.opacity = 0.3;
         raycaster.layers.disable( layer );
      }
      else
      {  // enable layer otherwise
         objects[layer].material.color.set(colors[layer]);
         objects[layer].material.opacity = 0.8;
         raycaster.layers.enable( layer );
      }
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'layer0', true)
    .name("Layer 0 (red)")
    .onChange(function(e) { controls.enableLayer(0) });
  gui.add(controls, 'layer1', false)
    .name("Layer 1 (green)")
    .onChange(function(e) { controls.enableLayer(1) });
  gui.add(controls, 'layer2', false)
    .name("Layer 2 (blue)")
    .onChange(function(e) { controls.enableLayer(2) });
}
