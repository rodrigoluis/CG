/**
 * @file tiles.js
 * Gerencia tiles de terreno procedural que rolam infinitamente.
 */

import * as THREE from "three";
import { installTerrain } from "./Terrain.js";
import { criaArvore } from "./arvore.js";
const Terrain = installTerrain(THREE);

let tileSize      = 2000;  // largura/profundidade de cada tile em unidades de mundo
let tileSegments  = 63;   // subdivisões do plano (mais segmentos = grade mais densa)
let tileScrollSpeed = 50; // velocidade de rolagem do chão em unidades/segundo

const terrainMaterial = new THREE.MeshLambertMaterial({
  color: "rgb(255, 255, 255)",
  vertexColors: true,
});

const tiles = [];
const terrainSeed = 1337;

if (globalThis.noise && typeof globalThis.noise.seed === "function") {
  globalThis.noise.seed(terrainSeed);
}

/**
 * Cria a grade inicial de tiles do plano e adiciona à cena.
 * @param {THREE.Scene} scene
 */
export function createWorldTiles(scene) {
  // Cria apenas dois tiles e alterna o reposicionamento
  for (let i = 0; i < 2; i++) {
    const tile = createTile();
    tile.position.set(0, 0, i * tileSize);
    tile.userData.tileX = 0;
    tile.userData.tileZ = i;
    rebuildTerrainForTile(tile, 0, i);
    tiles.push(tile);
    scene.add(tile);
  }
}

function createTile() {
  const tile = new THREE.Group();
  tile.userData = {
    tileX: null,
    tileZ: null,
    terrain: null,
  };
  return tile;
}

/**
 * Move os tiles no eixo Z e recicla os que saem da tela.
 * @param {number} delta - Tempo desde o último frame em segundos.
 */
export function updateTiles(delta) {
  const move = tileScrollSpeed * delta; // deslocamento neste frame
  const wrapThreshold = -tileSize * 0.7; // limite antes de sair da tela

  tiles.forEach((tile) => {
    tile.position.z -= move;

    // Quando o tile sai pela frente, teleporta para trás da grade
    if (tile.position.z < wrapThreshold) {
      const other = tiles[0] === tile ? tiles[1] : tiles[0];
      tile.userData.tileZ += 2; // alterna entre os dois tiles
      tile.position.z = other.position.z + tileSize;
      rebuildTerrainForTile(tile, tile.userData.tileX, tile.userData.tileZ);
    }
  });
}

function rebuildTerrainForTile(tile, tileX, tileZ) {
  if (tile.userData.terrain) {
    tile.remove(tile.userData.terrain);
  }

  const terrain = Terrain({
    heightmap: createSeamlessPerlinHeightmap(tileX, tileZ),
    material: terrainMaterial,
    xSize: tileSize,
    ySize: tileSize,
    xSegments: tileSegments,
    ySegments: tileSegments,
    maxHeight: 100,
    minHeight: -100,
    frequency: 2.0,
  });

  applyHeightGradient(terrain, -100, 100);

  tile.add(terrain);
  tile.userData.terrain = terrain;
}

function applyHeightGradient(terrain, minHeight, maxHeight) {
  if (!terrain.children || !terrain.children[0]) {
    return;
  }

  const mesh = terrain.children[0];
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;
  const count = positions.count;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const height = positions.getZ(i);
    const t = Math.min(1, Math.max(0, (height - minHeight) / (maxHeight - minHeight)));

    const color = lerpHeightColor(t);
    colors[i * 3] = color[0];
    colors[i * 3 + 1] = color[1];
    colors[i * 3 + 2] = color[2];
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.attributes.color.needsUpdate = true;
}

function lerpHeightColor(t) {
  const stops = [
    { t: 0.0, color: [0.12, 0.45, 0.18] },
    { t: 0.7, color: [0.42, 0.28, 0.14] },
    { t: 1.0, color: [0.95, 0.95, 0.95] },
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a.t && t <= b.t) {
      const localT = (t - a.t) / (b.t - a.t);
      return [
        a.color[0] + (b.color[0] - a.color[0]) * localT,
        a.color[1] + (b.color[1] - a.color[1]) * localT,
        a.color[2] + (b.color[2] - a.color[2]) * localT,
      ];
    }
  }

  return stops[stops.length - 1].color;
}

function createSeamlessPerlinHeightmap(tileX, tileZ) {
  const offsetX = tileX * tileSegments;
  const offsetZ = tileZ * tileSegments;

  return function (g, options) {
    if (!globalThis.noise || typeof globalThis.noise.perlin !== "function") {
      return;
    }

    const range = (options.maxHeight - options.minHeight) * 0.5;
    const divisor = (Math.min(options.xSegments, options.ySegments) + 1) / options.frequency;
    const xl = options.xSegments + 1;
    const yl = options.ySegments + 1;

    for (let i = 0; i < xl; i++) {
      for (let j = 0; j < yl; j++) {
        const nx = (i + offsetX) / divisor;
        const nz = (j + offsetZ) / divisor;
        g[j * xl + i] += globalThis.noise.perlin(nx, nz) * range;
      }
    }
  };
}
