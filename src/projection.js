import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import {initRenderer, 
        initCamera, 
        initTrackballControls,
        SecondaryBox,
        initDefaultSpotlight,
        onWindowResize, 
        lightFollowingCamera} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information

var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(0, 0, 30)); // Init camera in this position
var light = initDefaultSpotlight(scene, new THREE.Vector3(0, 0, 30)); // Use default light

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create a wireframe cube
var cubeGeometry = new THREE.BoxGeometry(10, 10, 10);
var cubeMaterial = new THREE.MeshBasicMaterial({wireframe: true});
var cube1 = new THREE.Mesh(cubeGeometry, cubeMaterial);
// add the cube to the scene
scene.add(cube1);

// create the inner cube
var cube2Geometry = new THREE.BoxGeometry(5, 5, 5);
var cube2Material = new THREE.MeshLambertMaterial({color:"rgb(70,110,130)"});
var cube2 = new THREE.Mesh(cube2Geometry, cube2Material);
// add the cube to the scene
scene.add(cube2);

var sphereGeometry = new THREE.SphereGeometry(2, 50, 50);
var sphereMaterial = new THREE.MeshLambertMaterial({color:"rgb(255,255,255)"});
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
// position the sphere
sphere.position.x = 0;
sphere.position.y = 0;
sphere.position.z = 5;
// add the sphere to the scene
scene.add(sphere);

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var projectionMessage = new SecondaryBox("Perspective Projection");

buildInterface();
render();

function restartCamera()
{
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 30;

  camera.up.x = 0;
  camera.up.y = 1;
  camera.up.z = 0;
}

function changeProjection()
{
  // Store the previous position of the camera
  var pos = new THREE.Vector3().copy(camera.position);

  if (camera instanceof THREE.PerspectiveCamera)
  {
    var s = 72; // Estimated size for orthographic projection
    camera = new THREE.OrthographicCamera(-window.innerWidth / s, window.innerWidth / s,
                                            window.innerHeight / s, window.innerHeight / -s, -s, s);
    projectionMessage.changeMessage("Orthographic");
  } else {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    projectionMessage.changeMessage("Perspective");
  }
  camera.position.copy(pos);
  camera.lookAt(scene.position);
  trackballControls = initTrackballControls(camera, renderer);
  lightFollowingCamera(light, camera) // Makes light follow the camera
}

function buildInterface()
{
  var controls = new function ()
  {
    this.onChangeProjection = function(){
      changeProjection();
    };
    this.onRestartCamera = function(){
      restartCamera();
    };
  };

  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'onChangeProjection').name("Change Projection");
  gui.add(controls, 'onRestartCamera').name("Restart Camera");
}

function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  lightFollowingCamera(light, camera) // Makes light follow the camera
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
