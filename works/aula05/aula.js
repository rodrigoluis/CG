import * as THREE from '../../../build/three.module.js';
import Stats from '../../../build/jsm/libs/stats.module.js';
import { GUI } from '../../../build/jsm/libs/dat.gui.module.js';
import { TrackballControls } from '../../../build/jsm/controls/TrackballControls.js';
import { builder } from './windMill.js';
import {
  initRenderer,
  initDefaultSpotlight,
  createGroundPlane,
  onWindowResize,
  degreesToRadians
} from "../../../libs/util/util.js";

var scene = new THREE.Scene();    // Create main scene
var stats = new Stats();          // To show FPS information
//var clock = new THREE.Clock();  
var light = initDefaultSpotlight(scene, new THREE.Vector3(25, 30, 20)); // Use default light
var renderer = initRenderer();    // View function in util/utils
renderer.setClearColor("rgb(30, 30, 42)");
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.lookAt(0, 0, 0);
camera.position.set(5, 15, 30);
camera.up.set(0, 1, 0);


// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement);

// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

var groundPlane = createGroundPlane(15.0, 15.0, 60, 60, "rgb(100,140,90)"); // width and height
groundPlane.rotateX(degreesToRadians(-90));
scene.add(groundPlane);

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper(12);
axesHelper.visible = false;
scene.add(axesHelper);

var playAction = false;



var speed = 0.05;


var windmill = builder(); //Inicia Estrutura do Moinho de Vento
windmill.position.set(0, 4, 0); 


/*Pas*/

let numSegmentos = 10;

// Pá da helice
function f_cima(x) {
  return - 0.00050444108 * Math.pow(x, 3) - 0.00548790867 * Math.pow(x, 2) + 0.42137729564 * x;
}
function f_baixo(x) {
  return -0.00000409725 * Math.pow(x, 5) + 0.00037498806 * Math.pow(x, 4) - 0.01262982208 * Math.pow(x, 3) + 0.20413763608 * Math.pow(x, 2) - 1.44841011601 * x
}

var heliceShape = new THREE.Shape();

let numPontos = numSegmentos * 2;
let maxFuncoes = 23.97;
let pontos = [];
// Função de cima, no intervalo [0, maxFuncoes]
for (let i = 0; i <= numPontos; i++) {
  let x = (maxFuncoes / numPontos) * i;
  let y = f_cima(x);
  if (x >= maxFuncoes) {
    y = 0;
  }
  pontos.push(new THREE.Vector2(x, y));
}
// Função de baixo, no intervalo [maxFuncoes, 0]
for (let i = numPontos; i >= 0; i--) {
  let x = (maxFuncoes / numPontos) * i;
  let y = f_baixo(x);
  if (x >= maxFuncoes) {
    y = 0;
  }
  pontos.push(new THREE.Vector2(x, y));
}

// Cria uma shape com os pontos
heliceShape.setFromPoints(pontos);

var extrudeSettings =
{
  depth: 0.4,
  bevelEnabled: true,
  bevelThickness: 0.22,
  bevelSize: 0.8,
  bevelOffset: 0,
  bevelSegments: 1
};


const metal = new THREE.TextureLoader().load( 'textures/BrushedMetal.jpg' );
const metalDark = new THREE.TextureLoader().load( 'textures/BrushedMetalDark.jpg' );
//--------------------------------------
const Spheregeometry = new THREE.SphereGeometry(0.2, 32, 32);
const motorMaterial = new THREE.MeshPhongMaterial({ map: metalDark });
const s5 = new THREE.Mesh(Spheregeometry, motorMaterial);


s5.translateZ(1.3);
s5.translateY(4);

var paG = new THREE.BoxGeometry(0.1, 1, 0.4);
var paM = new THREE.MeshPhongMaterial({ map: metal });

var extrudeGeometry = new THREE.ExtrudeGeometry(heliceShape, extrudeSettings);


var pa1 = new THREE.Mesh(
  new THREE.BoxGeometry(25, 0.8, 1.2),paM);
var pa2 = new THREE.Mesh(
  new THREE.BoxGeometry(25, 0.8, 1.2),paM);
var pa3 = new THREE.Mesh(
  new THREE.BoxGeometry(25, 0.8, 1.2),paM);
var pa4 = new THREE.Mesh(
  new THREE.BoxGeometry(25, 0.8, 1.2),paM);

pa1.scale.set(0.2,0.2,0.2);
pa2.scale.set(0.2,0.2,0.2);
pa3.scale.set(0.2,0.2,0.2);
pa4.scale.set(0.2,0.2,0.2);

pa2.rotateZ(degreesToRadians(90));
pa3.rotateZ(degreesToRadians(-90));
pa4.rotateZ(degreesToRadians(180));

s5.add(pa1, pa2, pa3, pa4);
windmill.add(s5);
scene.add(windmill);

function rotatePas() {


  // Set angle's animation speed
  if (playAction) {
    var angle = 0;
    angle += speed;
    s5.rotateZ(angle);

  }
}



function buildInterface() {
  //------------------------------------------------------------
  // Interface
  var controls = new function () {

    this.viewAxes = false;

    this.onPlayAnimation = function () {
      playAction = !playAction;
    };
    this.onViewAxes = function () {
      axesHelper.visible = this.viewAxes;
    }
    this.speed = 0.05;

    this.changeSpeed = function () {
      speed = this.speed;
    };

  };

  var gui = new GUI();

  gui.add(controls, 'viewAxes', false)
    .name("View Axes")
    .onChange(function (e) { controls.onViewAxes() });
  gui.add(controls, 'onPlayAnimation').name("Play / Stop Anim.");
  gui.add(controls, 'speed', 0.05, 0.5)
    .onChange(function (e) { controls.changeSpeed() })
    .name("Change Speed");
}

buildInterface();
render();

function render() {
  stats.update();
  trackballControls.update();
  rotatePas();
  requestAnimationFrame(render);
  renderer.render(scene, camera)
}
