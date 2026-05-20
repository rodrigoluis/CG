/**
 * @file tiles.js
 * Gerencia tiles de terreno procedural que rolam infinitamente.
 */

import * as THREE from "three";
import { installTerrain } from "./Terrain.js";

const Terrain = installTerrain(THREE);

let tileSize      = 1000;  // largura/profundidade de cada tile em unidades de mundo
let tileSegments  = 40;   // subdivisões do plano (mais segmentos = grade mais densa)
let tileScrollSpeed = 50; // velocidade de rolagem do chão em unidades/segundo

const terrainMaterial = new THREE.MeshLambertMaterial({ color: "rgb(44, 57, 42)" });

const tiles = [];

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
  const seed = (tileX * 73856093) ^ (tileZ * 19349663) ^ 0x9e3779b9;

  if (globalThis.noise && typeof globalThis.noise.seed === "function") {
    globalThis.noise.seed(seed >>> 0);
  }

  if (tile.userData.terrain) {
    tile.remove(tile.userData.terrain);
  }

  const terrain = Terrain({
    heightmap: Terrain.Perlin,
    material: terrainMaterial,
    xSize: tileSize,
    ySize: tileSize,
    xSegments: tileSegments,
    ySegments: tileSegments,
    maxHeight: 20,
    minHeight: -6,
    frequency: 2.0,
  });

  tile.add(terrain);
  tile.userData.terrain = terrain;
}
