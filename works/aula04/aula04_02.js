import * as THREE from '../../build/three.module.js';
import Stats from '../../build/jsm/libs/stats.module.js';
import { GUI } from '../../build/jsm/libs/dat.gui.module.js';
import * as TWEEN from '../../libs/other/node_modules/@tweenjs/tween.js/dist/tween.esm.js';
import { TrackballControls } from '../../build/jsm/controls/TrackballControls.js';
import {
  initRenderer,
  initCamera,
  degreesToRadians,
  onWindowResize,
  initDefaultBasicLight,
  createGroundPlane
} from "../../libs/util/util.js";

var stats = new Stats();          // To show FPS information
var scene = new THREE.Scene();    // Create main scene
var renderer = initRenderer();    // View function in util/utils
var camera = initCamera(new THREE.Vector3(5, -10, 7)); // Init camera in this position
var trackballControls = new TrackballControls(camera, renderer.domElement);
initDefaultBasicLight(scene);


var sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
var sphereMaterial = new THREE.MeshPhongMaterial({ color: 'rgb(155, 72, 253)' });
var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.position.set(0.0, 0.0, 0.0);
scene.add(sphere);

var tranlateTheSphere = false;
var posFin ={};


// Listen window size changes
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);


var groundPlane = createGroundPlane(25.0, 25.0, 60, 60, "rgb(255,255,255)");
groundPlane.rotateZ(degreesToRadians(-90));
groundPlane.position.set(0,0,-1);
scene.add(groundPlane);


function moveSphere() {

  var posAtual = {x:sphere.position.x , y:sphere.position.y, z:sphere.position.z};
  var target = {x:posFin[0],y:posFin[1],z:posFin[2]};

  var tween1 = new TWEEN.Tween(posAtual)
  .to(target, 2000)
  .easing(TWEEN.Easing.Elastic.In);//TWEEN.Easing.Quadratic.Out);

  tween1.start();



  const updateFunc = function (object, elapsed ) {
    sphere.position.x = object.x;
    sphere.position.y = object.y;
    sphere.position.z = object.z;
  }

  tween1.onUpdate(updateFunc);
  console.log(sphere.position.x);
  console.log(sphere.position.y);
  console.log(sphere.position.z);

}






function buildInterface() {
  var controls = new function () {
    this.posX = 0;
    this.posY = 0;
    this.posZ = 0;

    this.getPos = function () {
      posFin[0] = this.posX;
      posFin[1] = this.posY;
      posFin[2] = this.posZ;
    };


    this.move = function () {
      tranlateTheSphere = !tranlateTheSphere;

      if (tranlateTheSphere) {
        moveSphere();
        tranlateTheSphere = !tranlateTheSphere;
      }
    };


  };
  // GUI interface
  var gui = new GUI();
  gui.add(controls, 'posX', -12, 12)
    .onChange(function (e) { controls.getPos() })
    .name("Posição X");
  gui.add(controls, 'posY',  -12, 12)
    .onChange(function (e) { controls.getPos() })
    .name("Posição Y");
  gui.add(controls, 'posZ',  -12, 12)
    .onChange(function (e) { controls.getPos() })
    .name("Posição Z");
  gui.add(controls, 'move', true).name("Move");
}


buildInterface();
render();

function render() {
  stats.update(); // Update FPS
  TWEEN.update()
  trackballControls.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene

}