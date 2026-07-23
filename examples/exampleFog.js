import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import { FlyControls } from '../build/jsm/controls/FlyControls.js';
import KeyboardState from '../libs/util/KeyboardState.js';
import {
   initRenderer,
   SecondaryBox,
   initDefaultBasicLight,
   onWindowResize,
   InfoBox,
   createGroundPlaneWired
} from "../libs/util/util.js";

let clock = new THREE.Timer();
let flyOn = true;
let baseColor = "rgb(175, 200, 220)"; // It's important the fog color is the same as the background
let keyboard = new KeyboardState();
let scene = new THREE.Scene();    // Create main scene
    scene.fog = new THREE.Fog(baseColor, 1, 100); // ADD FOG TO THE SCENE
let renderer = initRenderer();    // View function in util/utils
   renderer.setClearColor(baseColor); // Set background to match fog color
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10.0, 15.0, 0.0);
camera.up.set(0, 1, 0);
initDefaultBasicLight(scene, true); // Use default light

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let groundPlane = createGroundPlaneWired(400, 400, 80, 80, 2, "dimgray", "gainsboro");
scene.add(groundPlane);

let flyCamera = new FlyControls(camera, renderer.domElement);
flyCamera.movementSpeed = 10;
flyCamera.domElement = renderer.domElement;
flyCamera.rollSpeed = 0.20;
flyCamera.autoForward = false;
flyCamera.dragToLook = false;

let loadingMessage = new SecondaryBox("");
showInformation();
buildInterface();

render();

//-- FUNCTIONS ---------------------------------------------------
function showInformation() {
   var controls = new InfoBox();
   controls.add("Fly Controls Example");
   controls.addParagraph();
   controls.add("Keyboard:");
   controls.add("* WASD - Move");
   controls.add("* R | F - up | down");
   controls.add("* Q | E - roll");
   controls.add("* Enter - start/stop fly control");
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

function buildInterface() {
   var controls = new function () {
      this.color = baseColor;
      this.updateColor = function () {
         renderer.setClearColor(this.color);
         scene.fog.color = new THREE.Color(this.color);
      };
   };

   var gui = new GUI();
   gui.addColor(controls, 'color')
      .name("Object Color")
      .onChange(function (e) { controls.updateColor(); });
   gui.add(scene.fog, 'far', 20, 200)
      .name("Fog Far");
}

function keyboardUpdate() {
   keyboard.update();
   if (keyboard.down("enter"))
   {
       flyOn = !flyOn;
       flyOn ? loadingMessage.changeMessage("Fly On") : loadingMessage.changeMessage("Fly Off");
   }
}

function render() {
   clock.update();
   const delta = clock.getDelta();
   keyboardUpdate();
   if (flyOn) flyCamera.update(delta);
   requestAnimationFrame(render);
   renderer.render(scene, camera)
}
