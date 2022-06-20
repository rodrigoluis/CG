import * as THREE from  'three';
import Stats from       '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        initBasicMaterial,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
initDefaultBasicLight(scene);
let material = initBasicMaterial(); // create a basic material

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// create a sphere
var sphereGeometry = new THREE.SphereGeometry(1);

var sphere1 = new THREE.Mesh(sphereGeometry, material);
// position the sphere
sphere1.position.set(-8.0, 1.0, 5.0);
// add the sphere to the scene
scene.add(sphere1);

// Set angles of rotation
var animation1 = true; // control if animation is on or of
var animation2 = true; // control if animation is on or of
var speed1 = 0.3;
var speed2 = 0.1;


var sphere2 = new THREE.Mesh(sphereGeometry, material);
// position the sphere
sphere2.position.set(-8.0, 1.0, -5.0);
// add the sphere to the scene
scene.add(sphere2);

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

function translateSpheres(){
  if(animation1){
    sphere1.translateX(speed1);
    if(sphere1.position.x > 8) animation1 = false;
  }
  if(animation2){
    sphere2.translateX(speed2);
    if(sphere2.position.x > 8) animation2 = false;
  }
}

function buildInterface()
{
  var controls = new function ()
  {
    this.onPlaySphere1 = function(){
      animation1 = !animation1;
      console.log(sphere1.position);
    };

    this.onPlaySphere2 = function(){
      animation2 = !animation2;
    };
    this.onReset = function(){
      sphere1.position.x = -8.0;
      sphere2.position.x = -8.0;      
      animation1 = false;
      animation2 = false;
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'onPlaySphere1',true).name("Esfera 1"); 
  gui.add(controls, 'onPlaySphere2',true).name("Esfera 2");
  gui.add(controls, 'onReset',true).name("Reset");
}
buildInterface();
render();
function render()
{
  translateSpheres();
  trackballControls.update(); // Enable mouse movements
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}