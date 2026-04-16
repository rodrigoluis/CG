import * as THREE from "three";
import Stats from "../../build/jsm/libs/stats.module.js";
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

let scene, renderer, camera, material, light, materialWire; // Initial variables
let baseColor = "rgb(175, 200, 220)";
materialWire = "rgb(179, 149, 149)";
scene = new THREE.Scene(); // Create main scene
scene.fog = new THREE.Fog(baseColor, 1, 400); // ADD FOG TO THE SCENE
renderer = initRenderer(); // Init a basic renderer

const stats = new Stats();
document.getElementById("webgl-output").appendChild(stats.domElement);

// Fog slider
let fogParams = {
  fogFar: scene.fog.far,
};
let gui = new GUI();
gui.add(fogParams, "fogFar", 50, 800, 1).onChange((value) => {
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


let tileSize = 200; // Size of each tile
let tileSegments = 40; // Number of segments for the plane geometry (higher = more detailed)
let tileRadius = 2; // Radius of each tile: 1 -> 3x3, 2 -> 5x5, etc.
let tiles = [];
let tileScrollSpeed = 50; // Units per second (positive moves tiles to -z)
const tileGridSize = tileRadius * 2 + 1;
const minTrees = 20;
const maxTrees = 50;

createWorldTiles();


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
function keyboardUpdate(delta) {
  keyboard.update();

  // Compute clamped target position from cursor
  const target = getWorldPositionAtZ(mouse.x, mouse.y, aviaoMesh.position.z);
  const bounds = getFrustumBoundsAtZ(camera, aviaoMesh.position.z);
  const clampedX = THREE.MathUtils.clamp(
    target.x,
    bounds.minX + PLANE_MARGIN,
    bounds.maxX - PLANE_MARGIN,
  );
  const clampedY = THREE.MathUtils.clamp(
    target.y,
    Math.max(bounds.minY + PLANE_MARGIN, PLANE_MARGIN),
    bounds.maxY - PLANE_MARGIN,
  );

  // Lerp toward target with 0.8s time constant
  const alpha = 1 - Math.exp(-delta / FOLLOW_DELAY);
  // aviaoMesh.position.x += (clampedX - aviaoMesh.position.x) * alpha;

  //Rotação em Z automatica
  const dx = clampedX - aviaoMesh.position.x;
  const MAX_BANK = THREE.MathUtils.degToRad(30);
  let targetRotationZ = -dx * -0.1;
  targetRotationZ = THREE.MathUtils.clamp(targetRotationZ, -MAX_BANK, MAX_BANK);
  aviaoMesh.rotation.z += (targetRotationZ - aviaoMesh.rotation.z) * alpha;
  aviaoMesh.position.x += dx * alpha;
  aviaoMesh.position.y += (clampedY - aviaoMesh.position.y) * alpha;

  //Rotação maunal 
  // let angle = THREE.MathUtils.degToRad(1);
  // if (keyboard.pressed("A")) aviaoMesh.rotateZ(-angle);
  // if (keyboard.pressed("D")) aviaoMesh.rotateZ(angle);
  // if (keyboard.pressed("W")) aviaoMesh.rotateY(-angle);
  // if (keyboard.pressed("S")) aviaoMesh.rotateY(angle);
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
  const delta = clock.getDelta();
  keyboardUpdate(delta);
  updateTiles(delta);
  stats.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera); // Render scene
}

function createWorldTiles() {                             // Cria os tiles iniciais para preencher a área visível
  for (let x = -tileRadius; x <= tileRadius; x++) {       // Loop que cria os tiles em um grid centrado na origem, com base no tileRadius
    for (let z = -tileRadius; z <= tileRadius; z++) {
      let tile = createTile(x, z);                        // Cria um tile com base nas coordenadas do grid
      tile.position.set(x * tileSize, 0, z * tileSize);   // Posiciona o tile no mundo, espaçando-os de acordo com tileSize
      tile.userData.tileX = x;
      tile.userData.tileZ = z;                            // Armazena as coordenadas do tile para referência futura
      rebuildTreesForTile(tile, x, z);                    // Popula o tile com árvores usando as coordenadas do tile para gerar uma semente de aleatoriedade consistente
      tiles.push(tile);
      scene.add(tile);
    }
  }
}

function createTile(offsetX, offsetZ) {                   // Cria um tile individual, que consiste em um plano de chão e um grupo para as árvores
  let tile = new THREE.Group();
  let plane = createGroundPlaneWired(tileSize, tileSize, tileSegments, tileSegments, 2, "rgb(121, 105, 105)", "rgb(45, 38, 35)");
  let treesGroup = new THREE.Group();                     // Grupo para conter as árvores do tile, facilitando a manipulação (remoção, adição, etc.)
  let treePool = [];

  for (let i = 0; i < maxTrees; i++) {
    let tipo = i % 2 === 0 ? 1 : 2;
    let treeWrapper = new Arvores(scene, tipo);
    let tree = treeWrapper.object;
    scene.remove(tree);
    tree.visible = false;
    tree.userData.tipo = tipo;
    treesGroup.add(tree);
    treePool.push(tree);
  }

  tile.add(plane);
  tile.add(treesGroup);
  tile.userData = {
    offsetX: offsetX,
    offsetZ: offsetZ,
    tileX: null,
    tileZ: null,
    treesGroup: treesGroup,
    treePool: treePool,
  };

  return tile;
}

function updateTiles(delta) {                             // Atualiza a posição dos tiles na cena, movendo-os para criar a ilusão de movimento do avião sobre o terreno
  const move = tileScrollSpeed * delta;                   
  const wrapDistance = tileSize * tileGridSize;       
  const wrapThreshold = -tileSize * (tileRadius + 0.5);   // Quando um tile cruza esse limite, ele é reposicionado para o outro lado do grid, criando um loop infinito de tiles

  tiles.forEach(function (tile) {
    tile.position.z -= move;
    if (tile.position.z < wrapThreshold) {
      tile.userData.tileZ += tileGridSize;
      tile.position.z += wrapDistance;
      rebuildTreesForTile(tile, tile.userData.tileX, tile.userData.tileZ);
      // Reconstrói as árvores do tile com base nas novas coordenadas do tile e no delta de tempo
    }
  });
}

function rebuildTreesForTile(tile, tileX, tileZ) {
  let treePool = tile.userData.treePool;
  let seed = (tileX * 73856093) ^ (tileZ * 19349663) ^ 0x9e3779b9;
  let rng = createSeededRandom(seed);
  let count = Math.floor(rng() * (maxTrees - minTrees + 1)) + minTrees;
  let margin = 8;

  let indices = Array.from({ length: treePool.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }

  for (let i = 0; i < treePool.length; i++) {
    let tree = treePool[indices[i]];
    if (i >= count) {
      tree.visible = false;
      continue;
    }
    let tipo = tree.userData.tipo || 1;
    let scale = THREE.MathUtils.lerp(0.6, 1.6, rng());
    let x = (rng() - 0.5) * (tileSize - margin * 2);
    let z = (rng() - 0.5) * (tileSize - margin * 2);
    let y = tipo === 1 ? 3 : 2.5;

    tree.visible = true;
    tree.position.set(x, y, z);
    tree.rotation.y = rng() * Math.PI * 2;
    tree.scale.set(scale, scale, scale);
  }

  function createSeededRandom(seed) {
    let state = seed >>> 0;
    return function () {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

}

