import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {GUI} from       '../build/jsm/libs/dat.gui.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        initCamera, 
        InfoBox,
        onWindowResize} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(0, -30, 15)); // Init camera in this position
var clock = new THREE.Clock();

// Show text information onscreen
showInformation();

// To use the keyboard
var keyboard = new KeyboardState();

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement );

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
var planeGeometry = new THREE.PlaneGeometry(20, 20);
planeGeometry.translate(0.0, 0.0, -0.02); // To avoid conflict with the axeshelper
var planeMaterial = new THREE.MeshBasicMaterial({
    color: "rgb(150, 150, 150)",
    side: THREE.DoubleSide
});
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
// add the plane to the scene
scene.add(plane);

// create a cube
var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
var cubeMaterial = new THREE.MeshNormalMaterial();
var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
// position the cube
cube.position.set(0.0, 0.0, 2.0);
// add the cube to the scene
scene.add(cube);

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

render();

function keyboardUpdate() {

  keyboard.update();

  var speed = 30;
  var moveDistance = speed * clock.getDelta();

  if ( keyboard.down("left") )   cube.translateX( -1 );
  if ( keyboard.down("right") )  cube.translateX(  1 );
  if ( keyboard.down("up") )     cube.translateY(  1 );
  if ( keyboard.down("down") )   cube.translateY( -1 );

  if ( keyboard.pressed("A") )  cube.translateX( -moveDistance );
  if ( keyboard.pressed("D") )  cube.translateX(  moveDistance );
  if ( keyboard.pressed("W") )  cube.translateY(  moveDistance );
  if ( keyboard.pressed("S") )  cube.translateY( -moveDistance );

  if ( keyboard.pressed("space") ) cube.position.set(0.0, 0.0, 2.0);
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Keyboard Example");
    controls.addParagraph();
    controls.add("Press WASD keys to move continuously");
    controls.add("Press arrow keys to move in discrete steps");
    controls.add("Press SPACE to put the cube in its original position");
    controls.show();
}

function render()
{
  stats.update(); // Update FPS
  requestAnimationFrame(render); // Show events
  trackballControls.update();
  keyboardUpdate();
  renderer.render(scene, camera) // Render scene
}
