import * as THREE from  '../build/three.module.js';
import { FlyControls } from '../build/jsm/controls/FlyControls.js';
import {initRenderer, 
        SecondaryBox,
        initDefaultBasicLight,
        onWindowResize, 
        InfoBox,
        createGroundPlaneWired} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
const clock = new THREE.Clock();
initDefaultBasicLight(scene, true); // Use default light

var renderer = initRenderer();    // View function in util/utils
  renderer.setClearColor("cornflowerblue");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(10.0, 15.0, 0.0);
  camera.up.set( 0, 1, 0 );

// Details here:
// https://threejs.org/docs/index.html#examples/en/controls/FlyControls
var flyCamera = new FlyControls( camera, renderer.domElement );
  flyCamera.movementSpeed = 10;
  flyCamera.domElement = renderer.domElement;
  flyCamera.rollSpeed = 0.20;
  flyCamera.autoForward = false;
  flyCamera.dragToLook = false;

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

var groundPlane = createGroundPlaneWired(400, 400, 80, 80); // width and height
  //groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

var infoBox = new SecondaryBox("");

showInformation();
render();

function showInformation()
{  
  var controls = new InfoBox();
    controls.add("Fly Controls Example");
    controls.addParagraph();
    controls.add("Keyboard:");            
    controls.add("* WASD - Move");
    controls.add("* R | F - up | down");
    controls.add("* Q | E - roll");
    controls.addParagraph();    
    controls.add("Mouse and Keyboard arrows:");            
    controls.add("* up | down    - pitch");        
    controls.add("* left | right - yaw");
    controls.addParagraph();    
    controls.add("Mouse buttons:");            
    controls.add("* Left  - Move forward");        
    controls.add("* Right - Move backward");

    controls.show();
}

function render()
{
  const delta = clock.getDelta();
  //stats.update();
  flyCamera.update(delta);
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
