import * as THREE from  '../build/three.module.js';
import Stats from       '../build/jsm/libs/stats.module.js';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        initCamera, 
        InfoBox,
        onWindowResize, 
        degreesToRadians} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(0, -30, 15)); // Init camera in this position
//var clock = new THREE.Clock();

// Use to scale the cube
var scale   = 1.0;

// Show text information onscreen
showInformation();

// To use the keyboard
var keyboard = new KeyboardState();

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

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

var cubeAxesHelper = new THREE.AxesHelper(9);
cube.add(cubeAxesHelper);

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

render();

function keyboardUpdate() {

  keyboard.update();

  var angle = degreesToRadians(10);
  var rotAxis = new THREE.Vector3(0,0,1); // Set Z axis

  if ( keyboard.pressed("left") )     cube.translateX( -1 );
  if ( keyboard.pressed("right") )    cube.translateX(  1 );
  if ( keyboard.pressed("up") )       cube.translateY(  1 );
  if ( keyboard.pressed("down") )     cube.translateY( -1 );
  if ( keyboard.pressed("pageup") )   cube.translateZ(  1 );
  if ( keyboard.pressed("pagedown") ) cube.translateZ( -1 );

  if ( keyboard.pressed("A") )  cube.rotateOnAxis(rotAxis,  angle );
  if ( keyboard.pressed("D") )  cube.rotateOnAxis(rotAxis, -angle );

  if ( keyboard.pressed("W") )
  {
    scale+=.1;
    cube.scale.set(scale, scale, scale);
  }
  if ( keyboard.pressed("S") )
  {
    scale-=.1;
    cube.scale.set(scale, scale, scale);
  }
}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Geometric Transformation");
    controls.addParagraph();
    controls.add("Use keyboard arrows to move the cube.");
    controls.add("Press Page Up or Page down to move the cube over the Z axis");
    controls.add("Press 'A' and 'D' to rotate.");
    controls.add("Press 'W' and 'S' to change scale");
    controls.show();
}

function render()
{
  stats.update(); // Update FPS
  trackballControls.update();
  keyboardUpdate();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
