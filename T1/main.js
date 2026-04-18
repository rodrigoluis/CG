import * as THREE from "three";
import Stats from "../../build/jsm/libs/stats.module.js";
import { criaAviao } from "./aviao.js";
import GUI from "../../libs/util/dat.gui.module.js";
import {
  initRenderer,
  initDefaultBasicLight,
  onWindowResize,
} from "../libs/util/util.js";
import { createWorldTiles, updateTiles } from "./tiles.js";
import { initMouseTracking, inputUpdate } from "./input.js";
import { updateCamera } from "./camera.js";

let baseColor = "rgb(148, 181, 224)";
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(baseColor, 1, 400);
let renderer = initRenderer();
renderer.setClearColor(baseColor);

const stats = new Stats();
document.getElementById("webgl-output").appendChild(stats.domElement);

let fogParams = { fogFar: scene.fog.far };
let gui = new GUI();
gui.add(fogParams, "fogFar", 50, 800, 1).onChange((value) => {
  scene.fog.far = value;
});

let light = initDefaultBasicLight(scene);
let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 25, -50);
camera.lookAt(0, 25, 0);
scene.add(camera);

initMouseTracking();

const aviaoController = criaAviao(scene);
let aviaoMesh = aviaoController.object;
aviaoMesh.position.set(0, 25, 0);

window.addEventListener("resize", function () { onWindowResize(camera, renderer); }, false);

let axesHelper = new THREE.AxesHelper(30);
scene.add(axesHelper);

createWorldTiles(scene);

const clock = new THREE.Clock();

render();
function render() {
  const delta = clock.getDelta();
  inputUpdate(aviaoMesh, camera, delta);
  updateTiles(delta);
  stats.update();
  requestAnimationFrame(render);
  updateCamera(camera, aviaoMesh, delta);
  renderer.render(scene, camera);
}
