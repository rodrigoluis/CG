/**
 * @file tiles.js
 * Gerencia os tiles de chão que rolam infinitamente enquanto o avião avança.
 */

import * as THREE from "three";
import { criaArvore } from "./arvore.js";
import { createGroundPlaneWired } from "../libs/util/util.js";

let tileSize      = 200;  // largura/profundidade de cada tile em unidades de mundo
let tileSegments  = 40;   // subdivisões do plano (mais segmentos = grade mais densa)
let tileRadius    = 2;    // grade 5×5 (de -2 a +2 em x e z)
let tiles         = [];   // lista de todos os tiles criados
let tileScrollSpeed = 50; // velocidade de rolagem do chão em unidades/segundo

const tileGridSize = tileRadius * 2 + 1; // quantos tiles por linha/coluna (5)
const minTrees = 20;
const maxTrees = 50;

/**
 * Cria a grade inicial de tiles do plano e adiciona à cena.
 * @param {THREE.Scene} scene
 */
export function createWorldTiles(scene) {
  // itera em grade quadrada de -tileRadius a +tileRadius nos eixos X e Z
  for (let x = -tileRadius; x <= tileRadius; x++) {
    for (let z = -tileRadius; z <= tileRadius; z++) {
      let tile = createTile(scene, x, z);
      tile.position.set(x * tileSize, 0, z * tileSize); // posição no mundo
      tile.userData.tileX = x;
      tile.userData.tileZ = z;
      rebuildTreesForTile(tile, x, z); // popula as árvores com seed determinística
      tiles.push(tile);
      scene.add(tile);
    }
  }
}

function createTile(scene, offsetX, offsetZ) {
  let tile      = new THREE.Group(); // agrupa plano + árvores num único objeto
  let plane     = createGroundPlaneWired(tileSize, tileSize, tileSegments, tileSegments, 2, "rgb(103, 182, 90)", "rgb(2, 60, 4)");
  let treesGroup = new THREE.Group();
  let treePool   = []; // pool de árvores pré-criadas para evitar criar/destruir a cada reciclagem

  // Pré-cria maxTrees árvores, alternando entre tipo 1 (conífera) e tipo 2 (copa esférica)
  for (let i = 0; i < maxTrees; i++) {
    let tipo = i % 2 === 0 ? 1 : 2;
    let treeWrapper = criaArvore(scene, tipo);
    let tree = treeWrapper.object;
    scene.remove(tree);       // remove da cena: a árvore agora pertence ao tile
    tree.visibltipoe = false; // começa invisível; rebuildTreesForTile decide se aparece
    tree.userData.tipo = tipo;
    treesGroup.add(tree);
    treePool.push(tree);
  }

  tile.add(plane);
  tile.add(treesGroup);
  tile.userData = {
    offsetX:    offsetX,
    offsetZ:    offsetZ,
    tileX:      null,
    tileZ:      null,
    treesGroup: treesGroup,
    treePool:   treePool,  // mantém referência ao pool para reciclagem
  };

  return tile;
}

/**
 * Move os tiles no eixo Z e recicla os que saem da tela.
 * @param {number} delta - Tempo desde o último frame em segundos.
 */
export function updateTiles(delta) {
  const move          = tileScrollSpeed * delta;          // deslocamento neste frame
  const wrapDistance  = tileSize * tileGridSize;          // distância total da grade (1000)
  const wrapThreshold = -tileSize * (tileRadius + 0.5);  // limite antes de sair da tela

  tiles.forEach(function (tile) {
    tile.position.z -= move; // move o tile em direção à câmera (avião "avança")

    // Quando o tile sai pela frente, teleporta para trás da grade
    if (tile.position.z < wrapThreshold) {
      tile.userData.tileZ += tileGridSize; // avança a coordenada lógica
      tile.position.z += wrapDistance;    // teleporta para o fim da fila
      rebuildTreesForTile(tile, tile.userData.tileX, tile.userData.tileZ); // novo layout de árvores
    }
  });
}

function rebuildTreesForTile(tile, tileX, tileZ) {
  let treePool = tile.userData.treePool;

  // mesma coordenada de tile sempre gera o mesmo layout (seed determinística)
  let seed = (tileX * 73856093) ^ (tileZ * 19349663) ^ 0x9e3779b9;
  let rng   = createSeededRandom(seed);

  let count  = Math.floor(rng() * (maxTrees - minTrees + 1)) + minTrees; // qtd de árvores
  let margin = 8; // afasta as árvores da borda do tile

  // embaralha para distribuição aleatória sem repetição
  let indices = Array.from({ length: treePool.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }

  for (let i = 0; i < treePool.length; i++) {
    let tree = treePool[indices[i]];

    // árvores além da contagem sorteada ficam invisíveis (pool não é deletado)
    if (i >= count) {
      tree.visible = false;
      continue;
    }

    let tipo  = tree.userData.tipo || 1;
    let scale = THREE.MathUtils.lerp(0.6, 1.6, rng());    // escala aleatória
    let x     = (rng() - 0.5) * (tileSize - margin * 2);  // posição X dentro do tile
    let z     = (rng() - 0.5) * (tileSize - margin * 2);  // posição Z dentro do tile
    let y     = tipo === 1 ? 3 : 2.5;                     // altura base por tipo

    tree.visible = true;
    tree.position.set(x, y, z);
    tree.rotation.y = rng() * Math.PI * 2; // rotação aleatória para variar o visual
    tree.scale.set(scale, scale, scale);
  }
}

function createSeededRandom(seed) {
  // sequência pseudo-aleatória reproduzível
  let state = seed >>> 0; // força unsigned 32-bit
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296; // normaliza para [0, 1)
  };
}
