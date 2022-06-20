import * as THREE from  '../build/three.module.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        InfoBox,
        createGroundPlaneWired,
        onWindowResize, 
        degreesToRadians} from "../libs/util/util.js";


var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("rgb(30, 30, 40)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.lookAt(0, 0, 0);  
  camera.position.set(0, 0, 1);
  camera.up.set( 0, 1, 0 );

var cameraHolder = new THREE.Object3D();
  cameraHolder.add(camera);
  cameraHolder.position.set(0.0, 2.0, 0.0);  
  //cameraHolder.rotateY(degreesToRadians(40));

scene.add(cameraHolder);

      
// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

scene.add( new THREE.HemisphereLight() );

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var plane = createGroundPlaneWired(150, 150, 50, 50);
scene.add(plane);

// Show text information onscreen
showInformation();

// To use the keyboard
var keyboard = new KeyboardState();

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );

render();



function keyboardUpdate() {

  keyboard.update();

  if ( keyboard.down("A") ) axesHelper.visible = !axesHelper.visible;

  if ( keyboard.pressed("space") )    cameraHolder.translateZ(  -0.3 );

  var angle = degreesToRadians(1);
  if ( keyboard.pressed("left") )  cameraHolder.rotateY(  angle );
  if ( keyboard.pressed("right") ) cameraHolder.rotateY( -angle );

  if ( keyboard.pressed("down") )  cameraHolder.rotateX(  angle );
  if ( keyboard.pressed("up") ) cameraHolder.rotateX( -angle );

  if ( keyboard.pressed(".") )  cameraHolder.rotateZ(-angle );
  if ( keyboard.pressed(",") ) cameraHolder.rotateZ( angle );

}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Flying camera");
    controls.addParagraph();
    controls.add("Press space to move");
    controls.add("Up / down Arrows to rotate x");
    controls.add("Left / Right arrows to rotate y");
    controls.add(", / . arrows to rotate z");    
    controls.add("Press 'A' to show/hide axes");
    controls.show();
}

function render()
{
  //trackballControls.update();
  keyboardUpdate();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
