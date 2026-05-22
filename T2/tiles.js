/**
 * @file tiles.js
 * Gerencia dois tiles de terreno procedural que rolam infinitamente no eixo Z.
 *
 * Opção implementada: múltiplos planos alternados (opção mais simples).
 *   Dois tiles de tamanho TILE_SIZE se alternam: quando o tile da frente sai
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
import { installTerrain } from "./Terrain.js";
import { criaArvore } from "./arvore.js";
const Terrain = installTerrain(THREE);

// ---------------------------------------------------------------------------
// Constantes de configuração do mundo
// ---------------------------------------------------------------------------

/** Largura e profundidade de cada tile em unidades de mundo. */
const TILE_SIZE = 2000;

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
const TREE_GRID_COLS = 8;
const TREE_GRID_ROWS = 8;

/** Distância mínima entre duas árvores (unidades de mundo, espaço local do tile). */
const TREE_MIN_DIST = 100;

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

  tileB.position.set(0, 0, TILE_SIZE);
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
 *   - O tile reciclado recebe `frontTile.position.z + TILE_SIZE` — posição absoluta,
 *     calculada depois que ambos os tiles já foram movidos neste frame.
 *   - O threshold é conservador (−TILE_SIZE * 0.3) para que a reciclagem ocorra
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
  //    Threshold em −TILE_SIZE * 0.3: o tile ainda está parcialmente visível,
  //    mas já é seguro teleportá-lo — há terreno suficiente na frente para cobrir a transição.
  const recycleThreshold = -TILE_SIZE * 0.4;

  if (backTile.position.z < recycleThreshold) {
    // Posição absoluta: exatamente um TILE_SIZE atrás do tile da frente.
    // Calculada depois do move deste frame → sem gap nem overlap garantido.
    backTile.position.z = frontTile.position.z + TILE_SIZE;
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
    tree.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });
  }

  // --- Constrói novo terreno ---
  const cols      = TILE_SEGMENTS + 1;
  const heightmap = buildFbmHeightmap(tile.userData.tileZ, frontEdgeHeights, cols);

  const terrainGroup = Terrain({
    heightmap,
    material:  terrainMaterial,
    xSize:     TILE_SIZE,
    ySize:     TILE_SIZE,
    xSegments: TILE_SEGMENTS,
    ySegments: TILE_SEGMENTS,
    maxHeight: MAX_HEIGHT,
    minHeight: MIN_HEIGHT,
    frequency: 2.0,
  });

  applyHeightColors(terrainGroup);

  tile.userData.backEdgeHeights = extractBackEdge(terrainGroup, cols);
  tile.add(terrainGroup);
  tile.userData.terrain = terrainGroup;

  // --- Planta árvores como filhas do tile ---
  const mesh = terrainGroup.children[0];
  if (mesh) {
    plantTrees(tile, mesh.geometry, cols);
  }
}

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

// ---------------------------------------------------------------------------
// Colorização por altura
// ---------------------------------------------------------------------------

/**
 * Atribui cores aos vértices do terreno com base na altitude,
 * simulando faixas de vegetação como em um mapa topográfico.
 *
 * @param {THREE.Group} terrainGroup
 */
function applyHeightColors(terrainGroup) {
  const mesh = terrainGroup.children[0];
  if (!mesh) return;

  const geometry  = mesh.geometry;
  const positions = geometry.attributes.position;
  const count     = positions.count;
  const colors    = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const height = positions.getZ(i);
    const t = Math.min(1, Math.max(0, (height - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT)));

    const [r, g, b] = sampleHeightGradient(t);
    colors[i * 3]     = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.attributes.color.needsUpdate = true;
}

/**
 * Interpola cor ao longo de um gradiente de altitude.
 *
 * Faixas:
 *   0.00 → verde escuro  — vales e planícies
 *   0.55 → verde claro   — encostas baixas
 *   0.70 → marrom        — rocha exposta
 *   1.00 → branco neve   — picos
 *
 * @param {number} t - Altitude normalizada [0, 1].
 * @returns {[number, number, number]} RGB em [0, 1].
 */
function sampleHeightGradient(t) {
  const gradient = [
    { t: 0.00, color: [0.10, 0.40, 0.15] }, // verde escuro  — vales e planícies
    { t: 0.55, color: [0.35, 0.55, 0.20] }, // verde claro   — encostas baixas
    { t: 0.70, color: [0.45, 0.32, 0.18] }, // marrom        — rocha nua
    { t: 1.00, color: [0.92, 0.92, 0.92] }, // branco acinzentado — neve nos picos
  ];

  for (let i = 0; i < gradient.length - 1; i++) {
    const from = gradient[i];
    const to   = gradient[i + 1];
    if (t >= from.t && t <= to.t) {
      const localT = (t - from.t) / (to.t - from.t);
      return [
        from.color[0] + (to.color[0] - from.color[0]) * localT,
        from.color[1] + (to.color[1] - from.color[1]) * localT,
        from.color[2] + (to.color[2] - from.color[2]) * localT,
      ];
    }
  }

  return gradient[gradient.length - 1].color;
}

// ---------------------------------------------------------------------------
// Plantio de árvores
// ---------------------------------------------------------------------------

/**
 * Distribui árvores pelo tile usando grade com jitter e verificação de distância mínima.
 * As árvores são adicionadas como filhas do tile (não da cena), então se movem com ele.
 *
 * Estratégia:
 *   1. Divide o tile em TREE_GRID_COLS × TREE_GRID_ROWS células.
 *   2. Sorteia uma posição aleatória dentro de cada célula (jitter).
 *   3. Lê a altura do terreno nessa posição via interpolação bilinear.
 *   4. Rejeita se fora da faixa de altitude de vegetação.
 *   5. Rejeita se muito próxima de outra árvore já aceita (TREE_MIN_DIST).
 *   6. Cria a árvore e a adiciona ao tile com posição em espaço local.
 *
 * @param {THREE.Group} tile
 * @param {THREE.BufferGeometry} geometry - Geometria do mesh do terreno.
 * @param {number} cols - Número de vértices por linha.
 */
function plantTrees(tile, geometry, cols) {
  const positions = geometry.attributes.position;
  const halfSize  = TILE_SIZE / 2; // vértices vão de -halfSize a +halfSize em X e Z

  const cellW = TILE_SIZE / TREE_GRID_COLS;
  const cellD = TILE_SIZE / TREE_GRID_ROWS;

  const placedPositions = []; // posições locais aceitas — para checar distância mínima

  for (let row = 0; row < TREE_GRID_ROWS; row++) {
    for (let col = 0; col < TREE_GRID_COLS; col++) {

      // Posição local aleatória dentro da célula (espaço do tile: −half a +half)
      const localX = -halfSize + (col + Math.random()) * cellW;
      const localZ = -halfSize + (row + Math.random()) * cellD;

      // Converte para coordenadas normalizadas [0, 1] para amostrar o heightmap
      const u = (localX + halfSize) / TILE_SIZE;
      const v = (localZ + halfSize) / TILE_SIZE;

      // Lê a altura do terreno nessa posição com interpolação bilinear
      const terrainHeight = sampleTerrainHeight(positions, u, v, cols);

      // Rejeita se altitude fora da faixa de vegetação
      if (terrainHeight < TREE_MIN_HEIGHT || terrainHeight > TREE_MAX_HEIGHT) continue;

      // Rejeita se muito próxima de outra árvore já aceita
      let tooClose = false;
      for (const p of placedPositions) {
        const dx = localX - p.x;
        const dz = localZ - p.z;
        if (dx * dx + dz * dz < TREE_MIN_DIST * TREE_MIN_DIST) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Cria a árvore e adiciona ao tile (não à cena) — ela se move com o tile
      const tipo   = Math.random() < 0.5 ? 1 : 2;
      const object = criaArvore(tipo);
      tile.add(object);

      // Posição em espaço local do tile:
      //   X e Z são as coordenadas locais calculadas acima.
      //   Y = altura do terreno lida da geometria (já em espaço local do tile).
      object.position.set(localX, terrainHeight, localZ);
      object.userData.isTree = true;

      placedPositions.push({ x: localX, z: localZ });
    }
  }
}

/**
 * Amostra a altura do terreno numa posição normalizada (u, v) usando interpolação bilinear
 * entre os quatro vértices da célula da grade correspondente.
 *
 * Interpolação bilinear:
 *   Calcula a altura dos quatro vértices que cercam o ponto e combina seus valores
 *   proporcionalmente à distância — resultado muito mais preciso do que o vértice mais próximo.
 *
 * @param {THREE.BufferAttribute} positions
 * @param {number} u - Posição horizontal normalizada [0, 1].
 * @param {number} v - Posição de profundidade normalizada [0, 1].
 * @param {number} cols
 * @returns {number} Altura interpolada.
 */
function sampleTerrainHeight(positions, u, v, cols) {
  // Índices flutuantes na grade de vértices
  const fx = Math.min(u * TILE_SEGMENTS, TILE_SEGMENTS - 0.001);
  const fz = Math.min(v * TILE_SEGMENTS, TILE_SEGMENTS - 0.001);

  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  const x1 = x0 + 1;
  const z1 = z0 + 1;

  const tx = fx - x0; // fração horizontal dentro da célula
  const tz = fz - z0; // fração de profundidade dentro da célula

  const h00 = positions.getZ(z0 * cols + x0);
  const h10 = positions.getZ(z0 * cols + x1);
  const h01 = positions.getZ(z1 * cols + x0);
  const h11 = positions.getZ(z1 * cols + x1);

  // Interpola nas duas linhas da célula, depois entre elas
  const h0 = h00 + (h10 - h00) * tx;
  const h1 = h01 + (h11 - h01) * tx;
  return h0 + (h1 - h0) * tz;
}
