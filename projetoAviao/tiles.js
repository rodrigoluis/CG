import * as THREE from "three";
import { criaArvore } from "./arvore.js";
import { createGroundPlaneWired } from "../libs/util/util.js";

let tileSize = 200;
let tileSegments = 40;
let tileRadius = 2;
let tiles = [];
let tileScrollSpeed = 50;
const tileGridSize = tileRadius * 2 + 1;
const minTrees = 20;
const maxTrees = 50;

export function createWorldTiles(scene) {
  for (let x = -tileRadius; x <= tileRadius; x++) {
    for (let z = -tileRadius; z <= tileRadius; z++) {
      let tile = createTile(scene, x, z);
      tile.position.set(x * tileSize, 0, z * tileSize);
      tile.userData.tileX = x;
      tile.userData.tileZ = z;
      rebuildTreesForTile(tile, x, z);
      tiles.push(tile);
      scene.add(tile);
    }
  }
}

function createTile(scene, offsetX, offsetZ) {
  let tile = new THREE.Group();
  let plane = createGroundPlaneWired(tileSize, tileSize, tileSegments, tileSegments, 2, "rgb(44, 57, 42)", "rgb(2, 60, 4)");
  let treesGroup = new THREE.Group();
  let treePool = [];

  for (let i = 0; i < maxTrees; i++) {
    let tipo = i % 2 === 0 ? 1 : 2;
    let treeWrapper = criaArvore(scene, tipo);
    let tree = treeWrapper.object;
    scene.remove(tree);
    tree.visibltipoe = false;
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

export function updateTiles(delta) {
  const move = tileScrollSpeed * delta;
  const wrapDistance = tileSize * tileGridSize;
  const wrapThreshold = -tileSize * (tileRadius + 0.5);

  tiles.forEach(function (tile) {
    tile.position.z -= move;
    if (tile.position.z < wrapThreshold) {
      tile.userData.tileZ += tileGridSize;
      tile.position.z += wrapDistance;
      rebuildTreesForTile(tile, tile.userData.tileX, tile.userData.tileZ);
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
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
