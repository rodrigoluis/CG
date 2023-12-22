import * as THREE from  'three';
import Stats from '../build/jsm/libs/stats.module.js';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {TeapotGeometry} from '../build/jsm/geometries/TeapotGeometry.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        InfoBox,
        SecondaryBox,
        initDefaultSpotlight,
        createLightSphere,        
        onWindowResize} from "../libs/util/util.js";

let scene, renderer, camera, stats, light, lightSphere, lightPosition, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer("rgb(30, 30, 42)");    // View function in util/utils
camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);
  camera.position.set(2.18, 1.62, 3.31);
  camera.up.set( 0, 1, 0 );
orbit = new OrbitControls( camera, renderer.domElement );
stats = new Stats();          // To show FPS information

lightPosition = new THREE.Vector3(1.7, 0.8, 1.1);
light = initDefaultSpotlight(scene, lightPosition); // Use default light
light.intensity = 0.9;
lightSphere = createLightSphere(scene, 0.1, 10, 10, lightPosition);

// To use the keyboard
var keyboard = new KeyboardState();

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// var groundPlane = createGroundPlane(4.0, 2.5, 50, 50); // width and height
//   groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
// scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 1.5 );
  axesHelper.visible = false;
scene.add( axesHelper );

// Show text information onscreen
showInformation();

var infoBox = new SecondaryBox("");

//---------------------------------------------------------
// Build Materials

/*
// Flat shading enabled in phong material
let geometry = new TeapotGeometry(0.5);
let material = new THREE.MeshPhongMaterial({
   color:"rgb(255,20,20)",
   flatShading: true
 });
let obj = new THREE.Mesh(geometry, material);
scene.add( obj );
*/

/*
// Gouraud Shading
let geometry = new TeapotGeometry(0.5);
let material = new THREE.MeshLambertMaterial({
   color:"rgb(255,20,20)"     
});
let obj = new THREE.Mesh(geometry, material);
scene.add( obj );
*/

/**/
// Phong Shading
let geometry = new TeapotGeometry(0.5);
let material = new THREE.MeshPhongMaterial({
   color:"rgb(255,20,20)",     // Main color of the object
   shininess:"200",            // Shininess of the object
   specular:"rgb(255,255,255)" // Color of the specular component
 });
let obj = new THREE.Mesh(geometry, material);
scene.add( obj );

render();

function keyboardUpdate()
{
  keyboard.update();
  if ( keyboard.pressed("D") )
  {
    lightPosition.x += 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("A") )
  {
    lightPosition.x -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("W") )
  {
    lightPosition.y += 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("S") )
  {
    lightPosition.y -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("E") )
  {
    lightPosition.z -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("Q") )
  {
    lightPosition.z += 0.05;
    updateLightPosition();
  }
}

// Update light position of the current light
function updateLightPosition()
{
  light.position.copy(lightPosition);
  lightSphere.position.copy(lightPosition);
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Lighting - Types of Materials");
    controls.addParagraph();
    controls.add("Use the WASD-QE keys to move the light");
    controls.show();
}

function render()
{
  stats.update();
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
