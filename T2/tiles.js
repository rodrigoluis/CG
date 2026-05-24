/**
 * @file tiles.js

 * Gerencia dois tiles de terreno procedural que rolam infinitamente no eixo Z.
 *
 * Opção implementada: múltiplos planos alternados (opção mais simples).
 *   Dois tiles de tamanho TILE_DEPTH se alternam: quando o tile da frente sai
 *   do campo de visão, ele é teleportado para atrás do tile atual e reconstruído
 *   com costura na borda de junção.
 *
 * Costura (seam stitching):
 *   Cada tile guarda as alturas da sua borda traseira (Z+). Ao reciclar,
 *   essas alturas são copiadas como borda frontal do tile novo, garantindo
 *   continuidade visual entre os dois segmentos.
 *
 * Reciclagem sem gap/overlap:
 *   O tile reciclado recebe sempre uma posição absoluta calculada a partir
 *   do tile vizinho — nunca relativa ao delta do frame atual. O threshold de
 *   reciclagem é antecipado o suficiente para que o gap nunca apareça mesmo
 *   com gameSpeed 3×.
 */

import * as THREE from "three";
import { criaArvore } from "./arvore.js";
const Terrain = createTerrain(THREE);

function ensureNoise() {
  if (
    globalThis.noise &&
    typeof globalThis.noise.seed === "function" &&
    typeof globalThis.noise.perlin === "function"
  ) {
    return;
  }

  const noise = {};
  globalThis.noise = noise;

  function Grad(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  Grad.prototype.dot2 = function (x, y) {
    return this.x * x + this.y * y;
  };

  var grad3 = [
    new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
    new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
    new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1),
  ];

  var p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103,
    30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94,
    252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171,
    168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
    1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159,
    86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147,
    118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183,
    170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129,
    22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
    251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239,
    107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4,
    150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215,
    61, 156, 180];

  var perm = new Array(512), gradP = new Array(512);

  noise.seed = function (seed) {
    if (seed > 0 && seed < 1) {
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }

    for (var i = 0; i < 256; i++) {
      var v;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed >> 8) & 255);
      }

      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
  };

  function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(a, b, t) {
    return (1 - t) * a + t * b;
  }

  noise.perlin = function (x, y) {
    var X = Math.floor(x), Y = Math.floor(y);
    x = x - X;
    y = y - Y;
    X = X & 255;
    Y = Y & 255;

    var n00 = gradP[X + perm[Y]].dot2(x, y);
    var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
    var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
    var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

    var u = fade(x);

    return lerp(
      lerp(n00, n10, u),
      lerp(n01, n11, u),
      fade(y)
    );
  };
}

function createTerrain(THREEParam) {
  const THREE = Object.assign({}, THREEParam);
  ensureNoise();

  return function Terrain(options) {
    const defaultOptions = {
      heightmap: null,
      material: null,
      maxHeight: 100,
      minHeight: -100,
      xSegments: 63,
      xSize: 1024,
      ySegments: 63,
      ySize: 1024,
      frequency: 2.5,
    };

    options = options || {};
    for (const opt in defaultOptions) {
      if (Object.prototype.hasOwnProperty.call(defaultOptions, opt)) {
        options[opt] = typeof options[opt] === "undefined" ? defaultOptions[opt] : options[opt];
      }
    }

    options.material = options.material || new THREE.MeshBasicMaterial({ color: 0xee6633 });

    const scene = new THREE.Object3D();
    scene.rotation.x = -0.5 * Math.PI;

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(options.xSize, options.ySize, options.xSegments, options.ySegments),
      options.material,
    );

    const positions = mesh.geometry.attributes.position;
    const zs = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i++) {
      zs[i] = positions.getZ(i);
    }

    if (typeof options.heightmap === "function") {
      const result = options.heightmap(zs, options);
      if (result && typeof result.length === "number" && result.length === zs.length) {
        for (let i = 0; i < zs.length; i++) {
          zs[i] = result[i];
        }
      }
    } else {
      console.warn("An invalid value was passed for `options.heightmap`: " + options.heightmap);
    }

    for (let i = 0; i < positions.count; i++) {
      positions.setZ(i, zs[i]);
    }
    positions.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingSphere();

    scene.add(mesh);
    return scene;
  };
}

// ---------------------------------------------------------------------------
// Constantes de configuração do mundo
// ---------------------------------------------------------------------------

/** Largura e profundidade de cada tile em unidades de mundo. */
const TILE_WIDTH = 1000;
const TILE_DEPTH = 4000;

/**
 * Número de subdivisões do plano em cada eixo.
 * Mais segmentos = terreno mais detalhado, mas mais pesado para a GPU.
 */
const TILE_SEGMENTS = 63;

/** Velocidade base de rolagem do chão (unidades/segundo), sem escala de gameSpeed. */
const TILE_SCROLL_SPEED = 50;

/** Amplitude máxima das montanhas em relação ao plano base. */
const MAX_HEIGHT =  100;
const MIN_HEIGHT = -20;

// ---------------------------------------------------------------------------
// Configuração das árvores
// ---------------------------------------------------------------------------

/**
 * Grade de distribuição de árvores: o tile é dividido em células,
 * e cada célula pode ter no máximo uma árvore.
 */
const TREE_GRID_COLS = 20;
const TREE_GRID_ROWS = 20;

/** Distância mínima entre duas árvores (unidades de mundo, espaço local do tile). */
const TREE_MIN_DIST = 50;

/** Faixa de altitude em que árvores podem nascer. Fora dela é rocha ou vale seco. */
const TREE_MAX_HEIGHT =  50;
const TREE_MIN_HEIGHT = -10;

// ---------------------------------------------------------------------------
// Material compartilhado entre os dois tiles
// ---------------------------------------------------------------------------

const terrainMaterial = new THREE.MeshLambertMaterial({
  color: "rgb(255, 255, 255)",
  vertexColors: true,
});

// ---------------------------------------------------------------------------
// Semente do ruído — terreno igual a cada execução
// ---------------------------------------------------------------------------

const TERRAIN_SEED = 1337;
if (globalThis.noise && typeof globalThis.noise.seed === "function") {
  globalThis.noise.seed(TERRAIN_SEED);
}

// ---------------------------------------------------------------------------
// Estado interno — dois tiles fixos, sem array crescente
// ---------------------------------------------------------------------------

/**
 * tileA e tileB são os dois tiles permanentes da cena.
 * A lógica de "frente/trás" é determinada dinamicamente pela posição Z,
 * não por índice fixo, o que elimina ambiguidade durante a reciclagem.
 */
let tileA = null;
let tileB = null;

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Cria os dois tiles iniciais e os adiciona à cena.
 *
 * @param {THREE.Scene} scene
 */
export function createWorldTiles(scene) {
  tileA = createTileGroup();
  tileB = createTileGroup();

  // tileA na posição imediata, tileB logo atrás
  tileA.position.set(0, 0, 0);
  tileA.userData.tileZ = 0;

  tileB.position.set(0, 0, TILE_DEPTH);
  tileB.userData.tileZ = 1;

  // Primeiro tile: sem costura (não há vizinho à frente)
  rebuildTerrain(tileA, null);
  // Segundo tile: costura com a borda traseira do primeiro
  rebuildTerrain(tileB, tileA.userData.backEdgeHeights);

  scene.add(tileA);
  scene.add(tileB);
}

/**
 * Avança os tiles e recicla o que saiu pela frente da câmera.
 *
 * Garantia contra gap/overlap:
 *   - Identifica explicitamente qual tile está à frente (maior Z) e qual está atrás.
 *   - O tile reciclado recebe `frontTile.position.z + TILE_DEPTH` — posição absoluta,
 *     calculada depois que ambos os tiles já foram movidos neste frame.
 *   - O threshold é conservador (−TILE_DEPTH * 0.5) para que a reciclagem ocorra
 *     bem antes do tile sair completamente da tela, com margem para gameSpeed 3×.
 *
 * @param {number} delta - Segundos desde o último frame (já multiplicado por gameSpeed).
 */
export function updateTiles(delta) {
  const move = TILE_SCROLL_SPEED * delta;

  // 1. Move os dois tiles
  tileA.position.z -= move;
  tileB.position.z -= move;

  // 2. Determina qual tile está mais à frente (maior Z = mais longe da câmera = mais novo)
  //    e qual está mais atrás (menor Z = mais próximo = candidato à reciclagem)
  const frontTile = tileA.position.z >= tileB.position.z ? tileA : tileB;
  const backTile  = tileA.position.z <  tileB.position.z ? tileA : tileB;

  // 3. Recicla o tile de trás se ele cruzou o threshold
  //    Threshold em −TILE_DEPTH * 0.5
  //    mas já é seguro teleportá-lo — há terreno suficiente na frente para cobrir a transição.
  const recycleThreshold = -TILE_DEPTH * 0.5;

  if (backTile.position.z < recycleThreshold) {
    // Posição absoluta: exatamente um TILE_DEPTH atrás do tile da frente.
    // Calculada depois do move deste frame → sem gap nem overlap garantido.
    backTile.position.z = frontTile.position.z + TILE_DEPTH;
    backTile.userData.tileZ += 2;

    // Costura: usa a borda traseira do tile à frente como borda frontal do reciclado
    rebuildTerrain(backTile, frontTile.userData.backEdgeHeights);
  }
}

// ---------------------------------------------------------------------------
// Criação e reconstrução de terreno
// ---------------------------------------------------------------------------

/** Cria um Group vazio com os campos userData necessários. */
function createTileGroup() {
  const group = new THREE.Group();
  group.userData = {
    tileZ:           null,
    terrain:         null,
    backEdgeHeights: null, // Float32Array: alturas da borda traseira para costura
    heightMatrix:    null, // Float32Array[COLS×COLS]: alturas de todos os vértices

  };
  return group;
}

/**
 * Destrói o terreno e as árvores do tile e constrói tudo novo.
 * As árvores são filhas do tile (não da cena), então se movem com ele.
 *
 * @param {THREE.Group} tile
 * @param {Float32Array|null} frontEdgeHeights - Alturas a costurar na borda frontal.
 */
function rebuildTerrain(tile, frontEdgeHeights) {
  // --- Remove terreno anterior ---
  if (tile.userData.terrain) {
    tile.remove(tile.userData.terrain);
    tile.userData.terrain.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });
    tile.userData.terrain = null;
  }

  // --- Remove árvores anteriores (são filhas do tile) ---
  // Iterar sobre uma cópia do array pois tile.children muda durante a remoção
  const toRemove = tile.children.filter((c) => c.userData.isTree);
  for (const tree of toRemove) {
    tile.remove(tree);
    tree.traverse((obj) => {if (obj.geometry) obj.geometry.dispose();});
  }

  // --- Constrói novo terreno ---
  const cols      = TILE_SEGMENTS + 1;
  const heightmap = buildFbmHeightmap(tile.userData.tileZ, frontEdgeHeights, cols);
  tile.userData.heightMatrix = heightmap; // Armazena a função de heightmap para referência futura (opcional, pode ser omitida)
  const terrainGroup = Terrain({
    heightmap,
    material:  terrainMaterial,
    xSize:     TILE_WIDTH,
    ySize:     TILE_DEPTH,
    xSegments: TILE_SEGMENTS,
    ySegments: TILE_SEGMENTS,
    maxHeight: MAX_HEIGHT,
    minHeight: MIN_HEIGHT,
    frequency: 2.0,
  });

  tile.userData.backEdgeHeights = extractBackEdge(terrainGroup, cols);
  
  tile.add(terrainGroup);
  tile.userData.terrain = terrainGroup;


// ---------------------------------------------------------------------------
// Geração de heightmap com fbm (fractal Brownian motion)
// ---------------------------------------------------------------------------

/**
 * Retorna uma função de heightmap para o THREE.Terrain.
 *
 * Variedade entre tiles:
 *   Cada tileZ diferente amostra uma fatia diferente do espaço de ruído contínuo.
 *   `offsetZ = tileZ * TILE_SEGMENTS` garante que tiles consecutivos nunca
 *   repitam a mesma região — o ruído é contínuo e infinito nessa direção.
 *
 * Costura:
 *   Quando `frontEdgeHeights` é fornecido, a linha j=0 (borda frontal) é
 *   forçada aos valores do tile vizinho, e a linha j=1 é suavizada com
 *   média ponderada para evitar descontinuidade visual.
 *
 * @param {number} tileZ
 * @param {Float32Array|null} frontEdgeHeights
 * @param {number} cols
 * @returns {Function}
 */
function buildFbmHeightmap(tileZ, frontEdgeHeights, cols) {
  const offsetZ = tileZ * TILE_SEGMENTS;

  return function perlinHeightmap(g, options) {
    if (!globalThis.noise || typeof globalThis.noise.perlin !== "function") return;

    const xl = options.xSegments + 1;
    const yl = options.ySegments + 1;

    // Passo 1: preenche toda a grade com ruído fbm
    for (let i = 0; i < xl; i++) {
      for (let j = 0; j < yl; j++) {
        g[j * xl + i] += fbm(i, j + offsetZ, options);
      }
    }

    // Passo 2: costura da borda frontal (j=0)
    if (frontEdgeHeights && frontEdgeHeights.length === xl) {
      for (let i = 0; i < xl; i++) {
        const seamHeight      = frontEdgeHeights[i];
        const generatedHeight = g[1 * xl + i];

        g[0 * xl + i] = seamHeight;                               // linha de costura exata
        g[1 * xl + i] = seamHeight * 0.5 + generatedHeight * 0.5; // suavização da transição
      }
    }
  };
}

/**
 * Altura num ponto via fractal Brownian motion (fbm):
 * soma de octaves de Perlin com frequência crescente e amplitude decrescente,
 * produzindo montanhas com detalhes em múltiplas escalas.
 *
 * @param {number} ni - Índice X do vértice.
 * @param {number} nj - Índice Z do vértice (já com offsetZ aplicado).
 * @param {object} options
 * @returns {number} Altura em unidades de mundo.
 */
function fbm(ni, nj, options) {
  const amplitude = (options.maxHeight - options.minHeight) * 0.5;
  const baseScale = (options.frequency * 5) / (options.xSegments + 1);

  const octaves     = 5;
  const lacunarity  = 1.0; // frequência dobra a cada octave
  const persistence = 0.5; // amplitude cai à metade a cada octave

  let value  = 0;
  let freq   = baseScale;
  let amp    = 1.0;
  let maxAmp = 0;

  for (let o = 0; o < octaves; o++) {
    value  += globalThis.noise.perlin(ni * freq, nj * freq) * amp;
    maxAmp += amp;
    freq   *= lacunarity;
    amp    *= persistence;
  }

  return (value / maxAmp) * amplitude;
}

// ---------------------------------------------------------------------------
// Utilidades de borda (seam stitching)
// ---------------------------------------------------------------------------

/**
 * Captura as alturas da última linha de vértices (borda traseira, Z máximo).
 * O tile seguinte usará esses valores para costurar sua borda frontal.
 *
 * @param {THREE.Group} terrainGroup
 * @param {number} cols
 * @returns {Float32Array}
 */
function extractBackEdge(terrainGroup, cols) {
  const mesh = terrainGroup.children[0];
  if (!mesh) return null;

  const positions = mesh.geometry.attributes.position;
  const lastRow   = TILE_SEGMENTS; // última linha: índice = TILE_SEGMENTS
  const heights   = new Float32Array(cols);

  for (let i = 0; i < cols; i++) {
    heights[i] = positions.getZ(lastRow * cols + i);
  }

  return heights;
}

}
