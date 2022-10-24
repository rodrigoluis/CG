import * as THREE from 'three';
import GUI from '../libs/util/dat.gui.module.js'
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
   initRenderer,
   initDefaultBasicLight,
   initCamera,
   createGroundPlane,
   SecondaryBox,        
   onWindowResize
} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit;
scene = new THREE.Scene();    
renderer = initRenderer();    
light = initDefaultBasicLight(scene, true, new THREE.Vector3(7, 7, 2));
camera = initCamera(new THREE.Vector3(3.6, 4.6, 8.2));
orbit = new OrbitControls( camera, renderer.domElement );

// Show axes 
let axesHelper = new THREE.AxesHelper(5);
axesHelper.translateY(0.1);
scene.add(axesHelper);

// "Moving" box
var movingMessage = new SecondaryBox("");
movingMessage.changeStyle("rgba(0,0,0,0)", "yellow", "25px", "ubuntu")

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let groundPlane = createGroundPlane(10, 10, 40, 40); // width, height, resolutionW, resolutionH
groundPlane.rotateX(THREE.MathUtils.degToRad(-90));
scene.add(groundPlane);

// Create object
let obj = buildObject()
scene.add(obj)

// Variables that will be used for linear interpolation
const lerpConfig = {
   destination: new THREE.Vector3(0.0, 0.25, 0.0),
   alpha: 0.01,
   angle: 0.0,
   move: false
}

buildInterface();
render();

function buildObject() {
   let size = 0.5
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

function buildInterface() {
   var controls = new function () {
      this.onMoveObject = function () {
         lerpConfig.move = true;
      };
   };

   let gui = new GUI();
   let folder = gui.addFolder("Interpolation Options");
   folder.open();
   folder.add(lerpConfig.destination, 'x', -5, 5).onChange();
   folder.add(lerpConfig.destination, 'y', 0.15, 3).onChange();
   folder.add(lerpConfig.destination, 'z', -5, 5).onChange();
   folder.add(lerpConfig, 'angle', 0, 360).onChange();
   folder.add(lerpConfig, 'alpha', 0.01, 1).onChange();
   folder.add(controls, 'onMoveObject').name(" MOVE ");
}

// Usefull to stop movement when 'maxDiff' value is achieved
function stopWhenCloseEnough(obj, quat) {
   let maxDiff = 0.1;
   let diffAngle = obj.quaternion.angleTo(quat)
   let diffDist = obj.position.distanceTo(lerpConfig.destination)
   movingMessage.changeMessage("Moving...");  
   if (diffAngle < maxDiff && diffDist < maxDiff) {
      lerpConfig.move = false;
      movingMessage.changeMessage("");
   }
}

function render() {
   if (lerpConfig.move) {
      let rad = THREE.MathUtils.degToRad(lerpConfig.angle)
      let quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rad);
      obj.position.lerp(lerpConfig.destination, lerpConfig.alpha);
      obj.quaternion.slerp(quat, lerpConfig.alpha)
      stopWhenCloseEnough(obj, quat)
   }
   requestAnimationFrame(render);
   renderer.render(scene, camera) // Render scene
}