import * as THREE from 'three';
import {TrackballControls} from '../build/jsm/controls/TrackballControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {initRenderer, 
        InfoBox,
        initDefaultBasicLight,
        initCamera,
        createGroundPlaneXZ,
        onWindowResize} from "../libs/util/util.js";

let scene, renderer, camera, light; 
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // View function in util/utils
camera = initCamera(new THREE.Vector3(5,15,50));
light = initDefaultBasicLight(scene, true, new THREE.Vector3(5,15,50), 80, 1024); 

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

let groundPlane = createGroundPlaneXZ(80, 80, 50, 50);
scene.add(groundPlane);

// Show text information onscreen
showInformation();

// To use the keyboard
var keyboard = new KeyboardState();

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls( camera, renderer.domElement );

// Create object
let object = buildObject(3.0)
scene.add(object)

render();

function buildObject(size) {
   let geometry = new THREE.BoxGeometry(size, size, size);
   let material = new THREE.MeshLambertMaterial({ color: "red" });
   let obj = new THREE.Mesh(geometry, material);

   geometry = new THREE.ConeGeometry( size/2, size, 50 );
   material = new THREE.MeshLambertMaterial( {color: 0xffff00} );
   let cone = new THREE.Mesh( geometry, material );
      cone.rotateX( Math.PI/2 );
      cone.position.z+=size
   obj.add(cone);

   obj.castShadow = true;
   obj.position.set(0, size / 2 + 0.1, 0);
   return obj;
}

function keyboardUpdate() {

  keyboard.update();

  if ( keyboard.pressed("up") )    object.translateZ(  1 );
  if ( keyboard.pressed("down") )  object.translateZ( -1 );

  var angle = THREE.MathUtils.degToRad(10);
  if ( keyboard.pressed("left") )  object.rotateY(  angle );
  if ( keyboard.pressed("right") ) object.rotateY( -angle );

}

function showInformation()
{
  // Use this to show information onscreen
  var controls = new InfoBox();
    controls.add("Camera Following Object");
    controls.addParagraph();
    controls.add("Use mouse to rotate/pan/zoom the camera");
    controls.add("Up / Arrow to walk");
    controls.add("Left / Right arrow to turn");
    controls.show();
}

function render()
{
  keyboardUpdate();

  trackballControls.update();
  trackballControls.target.copy(object.position); // Camera following object

  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera) // Render scene
}
