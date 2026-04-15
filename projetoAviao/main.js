import * as THREE from "three";
import { OrbitControls } from "../build/jsm/controls/OrbitControls.js";
import KeyboardState from "../../libs/util/KeyboardState.js";
import { Aviao } from "./aviao.js";
import GUI from "../../libs/util/dat.gui.module.js";
import { FlyControls } from "../../build/jsm/controls/FlyControls.js";
import { Arvores } from "./arvore.js";
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize,
  createGroundPlaneWired,
} from "../libs/util/util.js";

let scene, renderer, camera, material, light, orbit; // Initial variables
let baseColor = "rgb(175, 200, 220)";
scene = new THREE.Scene(); // Create main scene
  scene.fog = new THREE.Fog(baseColor, 1, 100); // ADD FOG TO THE SCENE
renderer = initRenderer(); // Init a basic renderer
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
scene.add(camera); // Add camera to the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.

//Criando aviao 
const aviaoController = new Aviao(scene);
let aviaoMesh = aviaoController.object;


for (let i = 0; i < 50; i++) {
  // Aumentei para 50 árvores
  let tipo = Math.random() > 0.5 ? 1 : 2;
  let arvore = new Arvores(scene, tipo);

  // Espalha as árvores em um range de -180 a 180 (dentro dos 400 do plano)
  let x = Math.random() * 360 - 180;
  let z = Math.random() * 360 - 180;

  // Altura baseada no tronco para ficarem sobre o plano
  let y = tipo === 1 ? 3 : 2.5;

  arvore.object.position.set(x, y, z);
}

// Listen window size changes
window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false,
);

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper(12);
scene.add(axesHelper);

// create the ground plane
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let groundPlane = createGroundPlaneWired(400, 400, 80, 80, 2, "dimgray", "gainsboro");
scene.add(groundPlane);


//Controles basicos para teste
var keyboard = new KeyboardState();
function keyboardUpdate() {
  keyboard.update();

  // Exemplo de movimento mais suave (0.1 em vez de 1)
  if (keyboard.pressed("left")) aviaoMesh.translateX(-1);
  if (keyboard.pressed("right")) aviaoMesh.translateX(1);
  if (keyboard.pressed("up")) aviaoMesh.translateY(-1);
  if (keyboard.pressed("down")) aviaoMesh.translateY(1);
  

  let angle = THREE.MathUtils.degToRad(1); // 1 grau por frame é melhor que 10
  if (keyboard.pressed("A")) aviaoMesh.rotateY(angle);
  if (keyboard.pressed("D")) aviaoMesh.rotateY(-angle);
  if (keyboard.pressed("W")) aviaoMesh.rotateX(angle);
  if (keyboard.pressed("S")) aviaoMesh.rotateX(-angle);
}

// Use this to show information onscreen
let controls = new InfoBox();
  controls.add("Basic Scene");
  controls.addParagraph();
  controls.add("Use mouse to interact:");
  controls.add("* Left button to rotate");
  controls.add("* Right button to translate (pan)");
  controls.add("* Scroll to zoom in/out.");
  controls.show();

render();
function render() {
    keyboardUpdate();
    requestAnimationFrame(render);
    renderer.render(scene, camera); // Render scene
}
