import * as THREE from  '../../build/three.module.js';
import Stats from       '../../../build/jsm/libs/stats.module.js';
import KeyboardState from '../../../libs/util/KeyboardState.js';
import {initRenderer, 
        initCamera, 
        initDefaultLighting,
        createGroundPlane,
        onWindowResize, 
        degreesToRadians,
        InfoBox} from "../../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils

//var light = initDefaultLighting(scene, new THREE.Vector3(5.0, 5.0, 5.0)); // Use default light    
scene.add(new THREE.HemisphereLight());
// Show world axes
var axesHelper = new THREE.AxesHelper( 120 );
scene.add( axesHelper );

// Main camera
var camera = initCamera(new THREE.Vector3(0,2.0,0)); 

// To use the keyboard
var keyboard = new KeyboardState();

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlane(40, 40); // width, height, resolutionW, resolutionH
groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);


// Create helper for the virtual camera
var cameraHolder = new THREE.Object3D();
cameraHolder.add(camera);

scene.add(cameraHolder);

render();

// Show text information onscreen
showInformation();

function keyboardUpdate() {

    keyboard.update();
  
    var angle = degreesToRadians(1);
    var XAxis = new THREE.Vector3(1,0,0); // Set X axis
    var YAxis = new THREE.Vector3(0,1,0); // Set Y axis
    var ZAxis = new THREE.Vector3(0,0,1); // Set Z axis
  
    if ( keyboard.pressed("space") )    cameraHolder.translateY( +2 );
    if ( keyboard.pressed("backspace") )    cameraHolder.translateY( -2 );
    
    if ( keyboard.pressed("down") )  cameraHolder.rotateOnAxis(XAxis,  angle );
    if ( keyboard.pressed("up") )  cameraHolder.rotateOnAxis(XAxis, -angle );
    
    if ( keyboard.pressed(",") )  cameraHolder.rotateOnAxis(YAxis,  angle );
    if ( keyboard.pressed(".") )  cameraHolder.rotateOnAxis(YAxis, -angle );
  
    if ( keyboard.pressed("right") )  cameraHolder.rotateOnAxis(ZAxis,  angle );
    if ( keyboard.pressed("left") )  cameraHolder.rotateOnAxis(ZAxis, -angle );
}
  

function showInformation()
{
    var controls = new InfoBox();
        controls.add("Flying Camera");
        controls.addParagraph();
        controls.add("Use space to move the camera forward");
        controls.add("Use backspace to move the camera back");
        controls.add("Press 'up' and 'down' to rotate the X axis");
        controls.add("Press 'left' and 'right' to rotate on Z axis");
        controls.add("Press ',' and '.' to rotate on Y axis");
        controls.show();
}

function render()
{
    stats.update(); // Update FPS
    keyboardUpdate();
    requestAnimationFrame(render); // Show events
    renderer.render(scene, camera);
}