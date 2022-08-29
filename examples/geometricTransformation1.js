import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        SecondaryBox,        
        onWindowResize, 
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Use to scale the cube
var scale = 1.0;

// Show text information onscreen
showInformation();

// To use the keyboard
var keyboard = new KeyboardState();

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// create a cube
var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
var cube = new THREE.Mesh(cubeGeometry, material);
// position the cube
cube.position.set(0.0, 2.0, 0.0);
// add the cube to the scene
scene.add(cube);

var cubeAxesHelper = new THREE.AxesHelper(9);
cube.add(cubeAxesHelper);

var positionMessage = new SecondaryBox("");
positionMessage.changeStyle("rgba(0,0,0,0)", "lightgray", "16px", "ubuntu")

render();

function keyboardUpdate() 
{
   keyboard.update();
   if ( keyboard.pressed("left") )     cube.translateX( -1 );
   if ( keyboard.pressed("right") )    cube.translateX(  1 );
   if ( keyboard.pressed("up") )       cube.translateY(  1 );
   if ( keyboard.pressed("down") )     cube.translateY( -1 );
   if ( keyboard.pressed("pageup") )   cube.translateZ(  1 );
   if ( keyboard.pressed("pagedown") ) cube.translateZ( -1 );

   let angle = THREE.MathUtils.degToRad(10); 
   if ( keyboard.pressed("A") )  cube.rotateY(  angle );
   if ( keyboard.pressed("D") )  cube.rotateY( -angle );

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
   updatePositionMessage();
}

function updatePositionMessage()
{
   var str =  "POS {" + cube.position.x.toFixed(1) + ", " + cube.position.y.toFixed(1) + ", " + cube.position.z.toFixed(1) + "} " + 
             "| SCL {" + cube.scale.x.toFixed(1) + ", " + cube.scale.y.toFixed(1) + ", " + cube.scale.z.toFixed(1) + "} " + 
             "| ROT {" + cube.rotation.x.toFixed(1) +  ", " + cube.rotation.y.toFixed(1) + ", " + cube.rotation.z.toFixed(1) + "}";              
   positionMessage.changeMessage(str);
}


function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Geometric Transformation");
    controls.addParagraph();
    controls.add("Use keyboard arrows to move the cube in XY.");
    controls.add("Press Page Up or Page down to move the cube over the Z axis");
    controls.add("Press 'A' and 'D' to rotate.");
    controls.add("Press 'W' and 'S' to change scale");
    controls.show();
}

function render()
{
  keyboardUpdate();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
