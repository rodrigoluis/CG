import * as THREE from "three";
import { OrbitControls } from "../../build/jsm/controls/OrbitControls.js";
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize,
  createGroundPlaneXZ,
} from "../../libs/util/util.js";
// === Importações Corrigidas ===
import KeyboardState from "../../libs/util/keyboardState.js";
import { criaAviao } from "./aviao.js";

let scene, renderer, camera, material, light, orbit; // Initial variables
scene = new THREE.Scene(); // Create main scene
renderer = initRenderer(); // Init a basic renderer
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene

// Init camera numa posição mais alta e recuada para enxergar o avião que nasce no alto
camera = initCamera(new THREE.Vector3(0, 45, 60));
scene.add(camera); // Add camera to the scene
orbit = new OrbitControls(camera, renderer.domElement); // Enable mouse rotation, pan, zoom etc.

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
let plane = createGroundPlaneXZ(20, 20);
scene.add(plane);

// === Inicialização do Avião ===
const aviaoController = criaAviao(scene);
let aviaoMesh = aviaoController.object;
// Definimos a posição do nó raiz do avião no ar
aviaoMesh.position.set(0, 10, 0);

// Controles basicos para teste
var keyboard = new KeyboardState();

function keyboardUpdate() {
  keyboard.update();

  // === SOLUÇÃO DO ERRO: Mudamos "corpo" para "aviaoMesh" ===
  // Calibramos a velocidade de translação para 0.2 para o avião se mover suavemente
  if (keyboard.pressed("left")) aviaoMesh.translateX(-0.2);
  if (keyboard.pressed("right")) aviaoMesh.translateX(0.2);
  if (keyboard.pressed("up")) aviaoMesh.translateY(0.2);
  if (keyboard.pressed("down")) aviaoMesh.translateY(-0.2);
  if (keyboard.pressed("pageup")) aviaoMesh.translateZ(0.2);
  if (keyboard.pressed("pagedown")) aviaoMesh.translateZ(-0.2);

  // Rotação suave de 2 graus por frame nas teclas A e D
  let angle = THREE.MathUtils.degToRad(2);
  if (keyboard.pressed("A")) aviaoMesh.rotateY(angle);
  if (keyboard.pressed("D")) aviaoMesh.rotateY(-angle);
}

// Use this to show information onscreen
let controls = new InfoBox();
controls.add("Basic Scene - Hello Kitty Plane");
controls.addParagraph();
controls.add("Use mouse to interact:");
controls.add("* Left button to rotate camera");
controls.add("* Right button to translate (pan)");
controls.add("* Scroll to zoom in/out.");
controls.addParagraph();
controls.add("Keyboard Controls:");
controls.add("* Arrows / PageUp / PageDown to move plane");
controls.add("* A / D to rotate plane");
controls.show();

render();

function render() {
  keyboardUpdate();
  orbit.update(); // Mantém os controles de órbita sincronizados
  requestAnimationFrame(render);
  renderer.render(scene, camera); // Render scene
}
