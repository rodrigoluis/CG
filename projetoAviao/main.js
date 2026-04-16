import * as THREE from "three";
import KeyboardState from "../../libs/util/KeyboardState.js";
import { Aviao } from "./aviao.js";
import { Arvores } from "./arvore.js";
import GUI from "../../libs/util/dat.gui.module.js";
import {
  initRenderer,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize,
  createGroundPlaneWired,
} from "../libs/util/util.js";

let scene, renderer, camera, material, light; // Initial variables
let baseColor = "rgb(175, 200, 220)";
scene = new THREE.Scene(); // Create main scene
scene.fog = new THREE.Fog(baseColor, 1, 100); // ADD FOG TO THE SCENE
renderer = initRenderer(); // Init a basic renderer

// Fog slider
const fogParams = {
  fogFar: 100,
};
const gui = new GUI();
gui.add(fogParams, "fogFar", 1, 500, 1).onChange((value) => {
  scene.fog.far = value;
});

material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 25, -50);
const airplaneInitialYPosition = 15;
camera.lookAt(0, airplaneInitialYPosition, 0); // Look at airplane initial position
scene.add(camera); // Add camera to the scene
// Mouse tracking
const mouse = new THREE.Vector2();
globalThis.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth)  *  2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * -2 + 1;
});

//Criando aviao
const aviaoController = new Aviao(scene);
let aviaoMesh = aviaoController.object;
aviaoMesh.position.set(0, 25, 0);

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
let axesHelper = new THREE.AxesHelper(30);
scene.add(axesHelper);

// create the ground plane
window.addEventListener('resize', function () { onWindowResize(camera, renderer) }, false);

let groundPlane = createGroundPlaneWired(400, 400, 80, 80, 2, "dimgray", "gainsboro");
scene.add(groundPlane);


// Computes the visible world-space rectangle at a given Z depth
function getFrustumBoundsAtZ(camera, targetZ) {
  const ndcCorners = [
    new THREE.Vector3(-1,  1, 0.5),
    new THREE.Vector3( 1,  1, 0.5),
    new THREE.Vector3(-1, -1, 0.5),
    new THREE.Vector3( 1, -1, 0.5),
  ];

  const worldPoints = ndcCorners.map(ndc => {
    const world = ndc.clone().unproject(camera);
    const dir = world.sub(camera.position).normalize();
    const t = (targetZ - camera.position.z) / dir.z;
    return new THREE.Vector3(
      camera.position.x + t * dir.x,
      camera.position.y + t * dir.y,
      targetZ
    );
  });

  return {
    minX: Math.min(...worldPoints.map(p => p.x)),
    maxX: Math.max(...worldPoints.map(p => p.x)),
    minY: Math.min(...worldPoints.map(p => p.y)),
    maxY: Math.max(...worldPoints.map(p => p.y)),
  };
}

const PLANE_MARGIN = 3;

function getWorldPositionAtZ(ndcX, ndcY, targetZ) {
  const ndc = new THREE.Vector3(ndcX, ndcY, 0.5);
  const world = ndc.unproject(camera);
  const dir = world.sub(camera.position).normalize();
  const t = (targetZ - camera.position.z) / dir.z;
  return new THREE.Vector3(
    camera.position.x + t * dir.x,
    camera.position.y + t * dir.y,
    targetZ
  );
}

const clock = new THREE.Clock();
const FOLLOW_DELAY = 0.5; // seconds (exponential smoothing time constant)

let keyboard = new KeyboardState();
function keyboardUpdate() {
  keyboard.update();
  const delta = clock.getDelta();

  // Compute clamped target position from cursor
  const target = getWorldPositionAtZ(mouse.x, mouse.y, aviaoMesh.position.z);
  const bounds = getFrustumBoundsAtZ(camera, aviaoMesh.position.z);
  const clampedX = THREE.MathUtils.clamp(target.x, bounds.minX + PLANE_MARGIN, bounds.maxX - PLANE_MARGIN);
  const clampedY = THREE.MathUtils.clamp(target.y, Math.max(bounds.minY + PLANE_MARGIN, PLANE_MARGIN), bounds.maxY - PLANE_MARGIN);

  // Lerp toward target with 0.8s time constant
  const alpha = 1 - Math.exp(-delta / FOLLOW_DELAY);
  aviaoMesh.position.x += (clampedX - aviaoMesh.position.x) * alpha;
  aviaoMesh.position.y += (clampedY - aviaoMesh.position.y) * alpha;

  let angle = THREE.MathUtils.degToRad(1);
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
