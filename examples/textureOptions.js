import * as THREE from 'three';
import Stats from '../build/jsm/libs/stats.module.js';
import GUI from '../libs/util/dat.gui.module.js'
import { TrackballControls } from '../build/jsm/controls/TrackballControls.js';
import {
   initRenderer,
   initDefaultSpotlight,
   onWindowResize
} from "../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
var renderer = initRenderer();    // View function in util/utils
renderer.setClearColor("rgb(30, 30, 42)");

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.lookAt(0, 0, 0);
camera.position.set(0.0, 0.0, 5.0);
camera.up.set(0, 1, 0);

var lightPosition = new THREE.Vector3(0.0, 0.0, 5.0);
var light = initDefaultSpotlight(scene, lightPosition, 100); // Use default light

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement);

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

//----------------------------------------------------------------------------
//-- Scene Objects -----------------------------------------------------------
var planeGeometry = new THREE.PlaneGeometry(4.0, 4.0, 10, 10);
var planeMaterial = new THREE.MeshLambertMaterial({ color: "rgb(255,255,255)", side: THREE.DoubleSide });
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane);

//----------------------------------------------------------------------------
//-- Use TextureLoader to load texture files
var textureLoader = new THREE.TextureLoader();
var floor = textureLoader.load('../assets/textures/marble.png');
    floor.colorSpace = THREE.SRGBColorSpace;

// Apply texture to the 'map' property of the plane
plane.material.map = floor;

// Set defaults
plane.material.map.wrapS = THREE.RepeatWrapping;
plane.material.map.wrapT = THREE.RepeatWrapping;
plane.material.map.minFilter = THREE.LinearFilter;
plane.material.map.magFilter = THREE.LinearFilter;

buildInterface();
render();


function buildInterface() {
   //------------------------------------------------------------
   // Interface
   var controls = new function () {
      this.wrapS = 'Repeat';
      this.wrapT = 'Repeat';
      this.mag = 'Linear';
      this.min = 'Linear';
      this.offsetX = 0;
      this.offsetY = 0;
      this.repeatX = 1.5;
      this.repeatY = 1.5;

      this.onChangeRepeatX = function () {
         //plane.material.map.repeat.set(this.repeatX, this.repeatY);
         plane.material.map.repeat.x = this.repeatX;
      };
      this.onChangeRepeatY = function () {
         //plane.material.map.repeat.set(this.repeatX, this.repeatY);
         plane.material.map.repeat.y = this.repeatY;         
      };
      this.onChangeOffsetX = function () {
         plane.material.map.offset.x = this.offsetX;
      };
      this.onChangeOffsetY = function () {
         plane.material.map.offset.y = this.offsetY;
      };
      this.onChangingWrappingMode_S = function () {
         var wrapModeS;
         switch (this.wrapS) {
            case 'Clamp':
               wrapModeS = THREE.ClampToEdgeWrapping;               
               break;
            case 'Repeat':
               wrapModeS = THREE.RepeatWrapping;
               break;
         }
         plane.material.map.wrapS = wrapModeS;
         plane.material.map.needsUpdate = true;
      };
      this.onChangingWrappingMode_T = function () {
         var wrapModeT;
         switch (this.wrapT) {
            case 'Clamp':
               wrapModeT = THREE.ClampToEdgeWrapping;               
               break;
            case 'Repeat':
               wrapModeT = THREE.RepeatWrapping;           
               break;
         }
         plane.material.map.wrapT = wrapModeT;
         plane.material.map.needsUpdate = true;
      };
      // Best to see if the object is far
      this.onChangingMinification = function () {
         var minFilter;
         switch (this.min) {
            case 'Linear':
               minFilter = THREE.LinearFilter;
               break;
            case 'Nearest':
               minFilter = THREE.NearestFilter;
               break;
         }
         plane.material.map.minFilter = minFilter;
         plane.material.map.needsUpdate = true;
      };
      // Best to see if the object is near
      this.onChangingMagnification = function () {
         var magFilter;
         switch (this.mag) {
            case 'Linear':
               magFilter = THREE.LinearFilter;
               break;
            case 'Nearest':
               magFilter = THREE.NearestFilter;
               break;
         }
         plane.material.map.magFilter = magFilter;
         plane.material.map.needsUpdate = true;
      };
   };

   var gui = new GUI();

   gui.add(controls, 'repeatX', 0.5, 10)
      .name("Repeat Factor")
      .onChange(function (e) { controls.onChangeRepeatX() });
   gui.add(controls, 'repeatY', 0.5, 10)
      .name("Repeat Factor")
      .onChange(function (e) { controls.onChangeRepeatY() });
   gui.add(controls, 'offsetX', 0.0, 1.0)
      .name("Offset X")
      .onChange(function (e) { controls.onChangeOffsetX() });
   gui.add(controls, 'offsetY', 0.0, 1.0)
      .name("Offset Y")
      .onChange(function (e) { controls.onChangeOffsetY() });
   gui.add(controls, 'wrapS', ['Clamp', 'Repeat'])
      .name("Wrapping Mode S")
      .onChange(function (e) { controls.onChangingWrappingMode_S(); });
   gui.add(controls, 'wrapT', ['Clamp', 'Repeat'])
      .name("Wrapping Mode T")
      .onChange(function (e) { controls.onChangingWrappingMode_T(); });
   gui.add(controls, 'mag', ['Linear', 'Nearest'])
      .name("Magnification")
      .onChange(function (e) { controls.onChangingMagnification(); });
   gui.add(controls, 'min', ['Linear', 'Nearest'])
      .name("Minification")
      .onChange(function (e) { controls.onChangingMinification(); });
}

function render() {
   stats.update();
   trackballControls.update();
   requestAnimationFrame(render);
   renderer.render(scene, camera)
}

