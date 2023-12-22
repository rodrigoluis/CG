/*
Autor: MARCELO DE MELO AMORIM FILHO
*/

import * as THREE from "three";
import Stats from "../build/jsm/libs/stats.module.js";
import GUI from "../libs/util/dat.gui.module.js";
import KeyboardState from '../libs/util/KeyboardState.js';
import { TrackballControls } from "../build/jsm/controls/TrackballControls.js";
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  createGroundPlaneXZ,
  createLightSphere,    
  onWindowResize,
} from "../libs/util/util.js";

import { CSG } from "../libs/other/CSGMesh.js";

var scene = new THREE.Scene(); // Create main scene
var stats = new Stats(); // To show FPS information
var keyboard = new KeyboardState();

var renderer = initRenderer(); // View function in util/utils
renderer.setClearColor("rgb(30, 30, 40)");
var camera = initCamera(new THREE.Vector3(4, 4, 8)); // Init camera in this position
camera.up.set(0, 1, 0);

window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false
);
let light = initDefaultBasicLight(scene, true, new THREE.Vector3(2.5, 0.7, 4.5), 28, 1024);

let lightPosition = light.position;
let lightSphere = createLightSphere(scene, 0.1, 10, 10, lightPosition);
  lightSphere.visible = false;

var groundPlane = createGroundPlaneXZ(20, 20); // width and height (x, y)
  groundPlane.position.set(0.0, -2.0, 0.0)
   //scene.add(groundPlane);

var trackballControls = new TrackballControls(camera, renderer.domElement);

//----------------------------------------------------------------------------------------------
//CANECA QUE NÃO BRILHA ENQUANTO A ALÇA BRILHA
let csgObject1, csgObject2, csgObject3;
let cylinderMaiorCSG, cylinderMenorCSG, toruCSG;

let canecaMaterial = new THREE.MeshPhongMaterial({
   color: "lightblue",
   shininess: "150",
   specular: "white",
});

let cylinderMaior = new THREE.Mesh(
   new THREE.CylinderGeometry(0.85, 0.85, 2.6, 40)
);
let cylinderMenor = new THREE.Mesh(
   new THREE.CylinderGeometry(0.75, 0.75, 2.4, 40)
);

let toru = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.2, 40, 40));
cylinderMaior.position.set(0, 1.3, 0);
cylinderMenor.position.set(0, 1.5, 0);
toru.position.set(0.8, 1.3,0);
updateObject(cylinderMaior);
updateObject(cylinderMenor);
updateObject(toru);
cylinderMaiorCSG = CSG.fromMesh(cylinderMaior);
cylinderMenorCSG = CSG.fromMesh(cylinderMenor);
toruCSG = CSG.fromMesh(toru);
csgObject1 = cylinderMaiorCSG.subtract(cylinderMenorCSG);
csgObject2 = toruCSG.subtract(cylinderMaiorCSG);
csgObject3 = csgObject1.union(csgObject2);
let caneca = CSG.toMesh(csgObject3,  new THREE.Matrix4());
caneca.material = canecaMaterial;
scene.add(caneca);

buildInterface();
render();


function updateObject(mesh) {
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
}

function buildInterface() {
  var controls = new (function () {
    this.wire = false;

    this.onWireframeMode = function () {
      caneca.material.wireframe = this.wire;
    };
  })();

  // GUI interface
  var gui = new GUI();
  gui
    .add(controls, "wire", false)
    .name("Wireframe")
    .onChange(function (e) {
      controls.onWireframeMode();
    });
}


function keyboardUpdate()
{
  keyboard.update();
  if ( keyboard.pressed("D") )
  {
    lightPosition.x += 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("A") )
  {
    lightPosition.x -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("W") )
  {
    lightPosition.y += 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("S") )
  {
    lightPosition.y -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("E") )
  {
    lightPosition.z -= 0.05;
    updateLightPosition();
  }
  if ( keyboard.pressed("Q") )
  {
    lightPosition.z += 0.05;
    updateLightPosition();
  }
}

// Update light position of the current light
function updateLightPosition()
{
  light.position.copy(lightPosition);
  lightSphere.position.copy(lightPosition);
  console.log(light.position)
}


function render() {
  stats.update(); // Update FPS
  keyboardUpdate();
  trackballControls.update();
  requestAnimationFrame(render); // Show events
  renderer.render(scene, camera); // Render scene
}
