import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import {
   initRenderer,
   initCamera,
   initDefaultBasicLight,
   onWindowResize,
   createGroundPlaneXZ
} from "../libs/util/util.js";

let scene, renderer, camera, orbit, light;
scene = new THREE.Scene();
light = initDefaultBasicLight(scene, true, new THREE.Vector3(0, 5, 0));
renderer = initRenderer();
camera = initCamera(new THREE.Vector3(2, 4, 5))
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let groundPlane = createGroundPlaneXZ(15.0, 15.0, 80, 80); // width and height
scene.add(groundPlane);

//-- Preparing the object that will be traversed -------------------------
let xwing = null;
loadGLTFFile('../assets/objects/xwing.glb');

buildInterface();
render();

function loadGLTFFile(name) {
   let loader = new GLTFLoader();
   loader.load(name, function (gltf) {
      let obj = gltf.scene;
      obj.traverse(function (child) {
         if (child.isMesh) {
            child.castShadow = true;
         }
         if (child.material) {
            child.material.side = THREE.DoubleSide;
            child.material.transparent = true;
         }
      });

      // Adjust position
      obj.position.set(0.0, 1.0, 2.0)
      xwing = obj; // Enable the use of this object outside
      scene.add(obj);
   });
}

function changeObjectColor(color) {
   if (xwing) {
      xwing.traverse(function (child) {
         if (child.material)
            child.material.color.set(color);
      });
   }
}

function changeObjectOpacity(op) {
   if (xwing) {
      xwing.traverse(function (child) {
         if (child.material)
            child.material.opacity = op;
      });
   }
}

function buildInterface() {
   // Interface
   let controls = new function () {
      this.color = "rgb(255,255,255)";
      this.opacity = 1.0;
      this.updateColor = function () {
         changeObjectColor(this.color);
      };
      this.setOpacity = function () {
         changeObjectOpacity(this.opacity);
      }
   };

   // GUI interface
   let gui = new GUI();
   gui.addColor(controls, 'color')
      .name("Obj Color")
      .onChange(function (e) { controls.updateColor() });
   gui.add(controls, 'opacity', 0.0, 1.0)
      .onChange(function () { controls.setOpacity() })
      .name("Opacity")
}

function render() {
   requestAnimationFrame(render);
   renderer.render(scene, camera)
}