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
  // Se o ruído já existe e já tem as funções necessárias, não recria nada.
  if (
    globalThis.noise &&
    typeof globalThis.noise.seed === "function" &&
    typeof globalThis.noise.perlin === "function"
  ) {
    return;
  }

  // Cria o objeto global de ruído que será usado pelo terreno procedural.
  const noise = {};
  globalThis.noise = noise;

  // Estrutura simples para representar gradientes 3D usados no Perlin.
  function Grad(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // Produto escalar no plano XY, usado para calcular contribuição do gradiente.
  Grad.prototype.dot2 = function (x, y) {
    return this.x * x + this.y * y;
  };

  // Vetores de gradiente pré-definidos usados pelo algoritmo de ruído.
  let grad3 = [
    new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
    new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
    new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1),
  ];

  // Permutação base do Perlin para embaralhar o acesso aos gradientes.
  let p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103,
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

  // Tabelas duplicadas para evitar módulos e simplificar o acesso aos vizinhos.
  let perm = new Array(512), gradP = new Array(512);

  // Inicializa a semente do ruído com um valor fornecido pela aplicação.
  noise.seed = function (seed) {
    if (seed > 0 && seed < 1) {
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }

    // Preenche as tabelas permutadas com base na semente.
    for (let i = 0; i < 256; i++) {
      let v;
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
    // Curva suave usada para interpolar os valores sem cantos duros.
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(a, b, t) {
    // Interpolação linear entre dois valores.
    return (1 - t) * a + t * b;
  }

  // Calcula o valor de ruído Perlin em coordenadas 2D.
  noise.perlin = function (x, y) {
    let X = Math.floor(x), Y = Math.floor(y);
    x = x - X;
    y = y - Y;
    X = X & 255;
    Y = Y & 255;

    let n00 = gradP[X + perm[Y]].dot2(x, y);
    let n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
    let n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
    let n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

    let u = fade(x);

    return lerp(
      lerp(n00, n10, u),
      lerp(n01, n11, u),
      fade(y)
    );
  };
}

function createTerrain(THREEParam) {
  // Copia a API do THREE recebida para usar os construtores necessários.
  const THREE = { ...THREEParam};
  // Garante que o ruído procedural esteja disponível antes de criar o terreno.
  ensureNoise();

  // Retorna uma fábrica de terreno compatível com a antiga API usada no projeto.
  return function Terrain(options) {
    // Valores padrão usados quando o chamador não informa uma opção.
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

    // Garante que sempre exista um objeto de opções para preenchimento dos defaults.
    options = options || {};
    for (const opt in defaultOptions) {
      if (Object.hasOwn(defaultOptions, opt)) {
        options[opt] = options[opt] === undefined ? defaultOptions[opt] : options[opt];
      }
    }

    // Se não vier material, cria um material básico como fallback.
    options.material = options.material || new THREE.MeshBasicMaterial({ color: 0xee6633 });

    // Grupo raiz do terreno; ele é rotacionado para ficar no plano horizontal correto.
    const scene = new THREE.Object3D();
    scene.rotation.x = -0.5 * Math.PI;

    // Malha principal do terreno construída como um plano subdividido.
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(options.xSize, options.ySize, options.xSegments, options.ySegments),
      options.material,
    );

    // Lê a geometria para editar diretamente os valores de altura dos vértices.
    const positions = mesh.geometry.attributes.position;
    const zs = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i++) {
      zs[i] = positions.getZ(i);
    }

    // Se uma função de heightmap foi fornecida, usa-a para modificar as alturas.
    if (typeof options.heightmap === "function") {
      const result = options.heightmap(zs, options);
      if (result && typeof result.length === "number" && result.length === zs.length) {
        // Se a função retornar um novo array, copia os valores para o buffer interno.
        for (let i = 0; i < zs.length; i++) {
          zs[i] = result[i];
        }
      }
    } else {
      // Aviso de uso incorreto: sem heightmap o terreno não terá o relevo esperado.
      console.warn("An invalid value was passed for `options.heightmap`: " + options.heightmap);
    }

    // Escreve as alturas calculadas de volta na geometria.
    for (let i = 0; i < positions.count; i++) {
      positions.setZ(i, zs[i]);
    }
    // Marca a geometria como alterada e recalcula normais e bounds.
    positions.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingSphere();

    mesh.receiveShadow = true;

    // Adiciona o mesh ao grupo raiz e devolve o terreno pronto para uso.
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
const MAX_HEIGHT =  80;
const MIN_HEIGHT = -20;

// ---------------------------------------------------------------------------
// Configuração das árvores
// ---------------------------------------------------------------------------

/**
 * Grade de distribuição de árvores: o tile é dividido em células,
 * e cada célula pode ter no máximo uma árvore.
 */
const TREE_GRID_COLS = 40;
const TREE_GRID_ROWS = 40;

/** Distância mínima entre duas árvores (unidades de mundo, espaço local do tile). */
const TREE_MIN_DIST = 30;

/** Faixa de altitude em que árvores podem nascer. Fora dela é rocha ou vale seco. */
const TREE_MAX_HEIGHT =  40;
const TREE_MIN_HEIGHT = -20;

/** Inclinação máxima do terreno para permitir o nascimento de árvores. */
const TREE_MAX_SLOPE_DEG = 20;

/** Compensação vertical para evitar que a base da árvore fique soterrada. */
const TREE_BASE_OFFSET = 3;

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

const TERRAIN_SEED = Math.random() * 65536;
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
  // Cria os dois tiles permanentes que serão reciclados durante o jogo.
  tileA = createTileGroup();
  tileB = createTileGroup();

  // Posiciona o primeiro tile na origem e o segundo logo atrás dele.
  // tileA na posição imediata, tileB logo atrás
  tileA.position.set(0, 0, 0);
  tileA.userData.tileZ = 0;

  tileB.position.set(0, 0, TILE_DEPTH);
  tileB.userData.tileZ = 1;

  // Primeiro tile: sem costura (não há vizinho à frente)
  // O primeiro tile não tem costura anterior, então nasce sem borda frontal presa a outro tile.
  rebuildTerrain(tileA, null);
  // O segundo tile usa a borda traseira do primeiro para manter continuidade visual.
  // Segundo tile: costura com a borda traseira do primeiro
  rebuildTerrain(tileB, tileA.userData.backEdgeHeights);

  // Adiciona os dois tiles à cena principal.
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
  // Calcula o deslocamento total deste frame.
  const move = TILE_SCROLL_SPEED * delta;

  // Move os dois tiles para trás, simulando o avanço do jogador.
  // 1. Move os dois tiles
  tileA.position.z -= move;
  tileB.position.z -= move;

  // Identifica qual tile está mais perto da câmera e qual está mais distante.
  // 2. Determina qual tile está mais à frente (maior Z = mais longe da câmera = mais novo)
  //    e qual está mais atrás (menor Z = mais próximo = candidato à reciclagem)
  const frontTile = tileA.position.z >= tileB.position.z ? tileA : tileB;
  const backTile  = tileA.position.z <  tileB.position.z ? tileA : tileB;

  // Define o limite em que o tile de trás já pode ser reaproveitado sem aparecer gap.
  // 3. Recicla o tile de trás se ele cruzou o threshold
  //    Threshold em −TILE_DEPTH * 0.5
  //    mas já é seguro teleportá-lo — há terreno suficiente na frente para cobrir a transição.
  const recycleThreshold = -TILE_DEPTH * 0.5;

  if (backTile.position.z < recycleThreshold) {
    // Coloca o tile reciclado exatamente após o tile da frente.
    // Posição absoluta: exatamente um TILE_DEPTH atrás do tile da frente.
    // Calculada depois do move deste frame → sem gap nem overlap garantido.
    backTile.position.z = frontTile.position.z + TILE_DEPTH;
    backTile.userData.tileZ += 2;

    // Reconstrói o terreno usando a borda traseira do tile da frente como costura.
    // Costura: usa a borda traseira do tile à frente como borda frontal do reciclado
    rebuildTerrain(backTile, frontTile.userData.backEdgeHeights);
  }
}

// ---------------------------------------------------------------------------
// Criação e reconstrução de terreno
// ---------------------------------------------------------------------------

/** Cria um Group vazio com os campos userData necessários. */
function createTileGroup() {
  // Cria um grupo vazio que vai conter terreno e árvores.
  const group = new THREE.Group();
  group.userData = {
    // Índice lógico do tile ao longo do eixo Z.
    tileZ:           null,
    // Referência para o grupo do terreno atual do tile.
    terrain:         null,
    // Alturas da borda traseira, usadas para costurar o próximo tile.
    backEdgeHeights: null, // Float32Array: alturas da borda traseira para costura
    // Matriz de alturas do terreno, guardada para consultas futuras.
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
  // Remove o terreno anterior antes de construir um novo.
  // --- Remove terreno anterior ---
  if (tile.userData.terrain) {
    tile.remove(tile.userData.terrain);
    tile.userData.terrain.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });
    tile.userData.terrain = null;
  }

  // Remove as árvores antigas, porque o tile será reconstruído com novos dados.
  // --- Remove árvores anteriores (são filhas do tile) ---
  // Iterar sobre uma cópia do array pois tile.children muda durante a remoção
  const toRemove = tile.children.filter((c) => c.userData.isTree);
  for (const tree of toRemove) {
    tile.remove(tree);
    tree.traverse((obj) => {if (obj.geometry) obj.geometry.dispose();});
  }

  // Gera um novo heightmap com base no índice lógico do tile e na costura anterior.
  // --- Constrói novo terreno ---
  const cols      = TILE_SEGMENTS + 1;
  const heightmap = buildFbmHeightmap(tile.userData.tileZ, frontEdgeHeights, cols);
  tile.userData.heightMatrix = heightmap; // Armazena a função de heightmap para referência futura (opcional, pode ser omitida)
  // Cria a geometria do terreno usando a fábrica Terrain compatível com a antiga API.
  const terrainGroup = Terrain({
    heightmap,
    material:  terrainMaterial,
    xSize:     TILE_WIDTH,
    ySize:     TILE_DEPTH,
    xSegments: TILE_SEGMENTS,
    ySegments: TILE_SEGMENTS,
    maxHeight: MAX_HEIGHT,
    minHeight: MIN_HEIGHT,
    frequency: 2,
  });

    // Aplica coloração por altura antes de plantar as árvores.
    applyHeightColors(terrainGroup);

    // Planta árvores sobre a malha gerada.
    plantTrees(tile, terrainGroup.children[0].geometry, cols);

  // Captura a borda traseira para costurar o próximo tile quando ele for criado.
  tile.userData.backEdgeHeights = extractBackEdge(terrainGroup, cols);
  
  // Anexa o terreno final ao tile e registra a referência.
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
  // Desloca a amostragem ao longo do eixo Z para que cada tile pegue uma fatia diferente do ruído.
  const offsetZ = tileZ * TILE_SEGMENTS;

  // Retorna uma função que o construtor de terreno vai chamar para preencher as alturas.
  return function perlinHeightmap(g, options) {
    // Se o ruído ainda não estiver disponível, sai sem alterar os valores.
    if (!globalThis.noise || typeof globalThis.noise.perlin !== "function") return;

    // Calcula a quantidade de vértices em cada eixo da grade.
    const xl = options.xSegments + 1;
    const yl = options.ySegments + 1;

    // Preenche cada vértice com uma altura baseada em fbm.
    // Passo 1: preenche toda a grade com ruído fbm
    for (let i = 0; i < xl; i++) {
      for (let j = 0; j < yl; j++) {
        g[j * xl + i] += fbm(i, j + offsetZ, options);
      }
    }

    // Se houver costura anterior, força a primeira linha a casar com ela.
    // Passo 2: costura da borda frontal (j=0)
    if (frontEdgeHeights && frontEdgeHeights.length === xl) {
      for (let i = 0; i < xl; i++) {
        // Usa o valor exato da borda anterior na linha de junção.
        const seamHeight      = frontEdgeHeights[i];
        // Mantém também uma amostra da linha seguinte para suavizar a transição.
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
  // Calcula a amplitude geral do relevo com base na faixa de alturas configurada.
  const amplitude = (options.maxHeight - options.minHeight) * 0.5;
  // Escala inicial do ruído, ajustando a frequência espacial do terreno.
  const baseScale = (options.frequency * 5) / (options.xSegments + 1);

  // Número de camadas de ruído empilhadas para criar detalhe em múltiplas escalas.
  const octaves     = 5;
  // Cada octave aumenta a frequência do ruído.
  const lacunarity  = 1; // frequência dobra a cada octave
  // Cada octave reduz a amplitude da contribuição.
  const persistence = 0.5; // amplitude cai à metade a cada octave

  // Acumuladores do valor final e da normalização.
  let value  = 0;
  let freq   = baseScale;
  let amp    = 1;
  let maxAmp = 0;

  // Soma várias amostras de Perlin com frequências e amplitudes diferentes.
  for (let o = 0; o < octaves; o++) {
    value  += globalThis.noise.perlin(ni * freq, nj * freq) * amp;
    maxAmp += amp;
    freq   *= lacunarity;
    amp    *= persistence;
  }

  // Normaliza o resultado para o intervalo esperado e converte para altura real.
  const normalized = Math.max(-1, Math.min(1, value / maxAmp));
  return options.minHeight + ((normalized + 1) * 0.5) * (options.maxHeight - options.minHeight);
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
  // Pega a malha principal do terreno gerado.
  const mesh = terrainGroup.children[0];
  if (!mesh) return null;

  // Lê as posições para capturar a última linha de vértices.
  const positions = mesh.geometry.attributes.position;
  // Última linha da grade, correspondente à borda traseira do tile.
  const lastRow   = TILE_SEGMENTS; // última linha: índice = TILE_SEGMENTS
  // Array com as alturas que serão usadas na costura do próximo tile.
  const heights   = new Float32Array(cols);

  // Copia as alturas da borda traseira para o array de retorno.
  for (let i = 0; i < cols; i++) {
    heights[i] = positions.getZ(lastRow * cols + i);
  }

  return heights;
}


/**
 * Aplica coloração discreta ao plane com base na altitude normalizada.
 *
 * Faixas:
 *   - t > 0.90 -> branco
 *   - 0.65 < t <= 0.90 -> marrom
 *   - t <= 0.65 -> verde
 *
 * Onde t é a altura normalizada no intervalo [0, 1].
 *
 * @param {THREE.Group} terrainGroup
 */
function applyHeightColors(terrainGroup) {
  // Obtém a malha do terreno para criar um atributo de cor por vértice.
  const mesh = terrainGroup.children[0];
  if (!mesh) return;

  // Lê a geometria para mapear a cor de cada vértice pela sua altitude.
  const geometry = mesh.geometry;
  const positions = geometry.attributes.position;
  const count = positions.count;
  const colors = new Float32Array(count * 3);

  // Para cada vértice, calcula uma cor com base na altura normalizada.
  for (let i = 0; i < count; i++) {
    const height = positions.getZ(i);
    const t = Math.min(1, Math.max(0, (height - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT)));
    const [r, g, b] = samplePlaneColor(t);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  // Anexa o atributo de cor para que o material use as cores por vértice.
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.attributes.color.needsUpdate = true;
}

/**
 * Retorna a cor do plane a partir da altura normalizada.
 *
 * @param {number} t
 * @returns {[number, number, number]}
 */
function samplePlaneColor(t) {
  // Altitudes muito altas viram neve.
  if (t > 0.8) {
    return [1, 1, 1];
  }

  // Altitudes intermediárias altas viram rocha.
  if (t > 0.7) {
    return [0.4, 0.4, 0.4];
  }

  // Altitudes intermediárias viram terra exposta.
  if (t > 0.55) {
    return [0.45, 0.32, 0.18];
  }

  if (t > 0.3) {
    return [0.1, 0.4, 0.15];
  }

  return [0.05, 0.2, 0.1]; // Altitudes baixas viram vegetação densa.
}
  // Regiões baixas permanecem verdes.
  

/**
 * Planta árvores no tile respeitando altura, inclinação e distância mínima.
 *
 * @param {THREE.Group} tile
 * @param {THREE.BufferGeometry} geometry
 * @param {number} cols
 */
function plantTrees(tile, geometry, cols) {
  // Acessa os atributos de posição e normal do terreno para amostrar altura e inclinação.
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  // Sem esses atributos não dá para decidir onde plantar árvores.
  if (!positions || !normals) return;

  // Metade da largura e da profundidade do tile, usadas para converter coordenadas locais.
  const halfWidth = TILE_WIDTH / 2;
  const halfDepth = TILE_DEPTH / 2;
  // Tamanho de cada célula da grade de tentativa de plantio.
  const cellW = TILE_WIDTH / TREE_GRID_COLS;
  const cellD = TILE_DEPTH / TREE_GRID_ROWS;
  // Guarda as posições já ocupadas para evitar árvores muito próximas.
  const placedPositions = [];
  // Eixo “para cima” no espaço local do terreno.
  const localUp = new THREE.Vector3(0, 0, 1);
  // Eixo vertical no espaço do mundo, usado para orientar a árvore.
  const worldUp = new THREE.Vector3(0, 1, 0);
  // Limite de inclinação convertido para cosseno, pois o produto escalar usa essa forma.
  const maxSlopeCos = Math.cos(THREE.MathUtils.degToRad(TREE_MAX_SLOPE_DEG));

  // Percorre a grade inteira do tile tentando plantar uma árvore em cada célula.
  for (let row = 0; row < TREE_GRID_ROWS; row++) {
    for (let col = 0; col < TREE_GRID_COLS; col++) {
      // Escolhe uma posição aleatória dentro da célula para quebrar o padrão visual.
      const localX = -halfWidth + (col + Math.random()) * cellW;
      const localZ = -halfDepth + (row + Math.random()) * cellD;
      // Converte a posição local em coordenadas normalizadas no intervalo [0, 1].
      const u = (localX + halfWidth) / TILE_WIDTH;
      const v = (localZ + halfDepth) / TILE_DEPTH;

      // Amostra a altura e as normais interpoladas nesse ponto do terreno.
  const { height, localNormal, worldNormal } = sampleTerrainPoint(positions, normals, u, v, cols);

      // Rejeita pontos fora da faixa de altitude desejada para árvores.
      if (height < TREE_MIN_HEIGHT || height > TREE_MAX_HEIGHT) continue;
      // Rejeita pontos cuja inclinação local seja maior que o permitido.
  if (localNormal.dot(localUp) < maxSlopeCos) continue;

      // Verifica se a árvore nova ficaria perto demais de alguma árvore já colocada.
      let tooClose = false;
      for (const p of placedPositions) {
        // Diferença em X e Z entre a posição candidata e uma árvore anterior.
        const dx = localX - p.x;
        const dz = localZ - p.z;
        // Se a distância ao quadrado for menor que o mínimo permitido, rejeita a posição.
        if (dx * dx + dz * dz < TREE_MIN_DIST * TREE_MIN_DIST) {
          tooClose = true;
          break;
        }
      }
      // Se já existe árvore muito perto, não planta outra aqui.
      if (tooClose) continue;

      // Escolhe aleatoriamente um dos dois tipos de árvore disponíveis.
      const tipo = Math.random() < 0.5 ? 1 : 2;
      // Cria a árvore na origem; a posição real será ajustada logo abaixo.
      const object = criaArvore(tipo);
      // Adiciona a árvore como filha do tile para que ela acompanhe a reciclagem.
      tile.add(object);

      // Alinha a orientação da árvore com a normal do terreno.
      object.quaternion.setFromUnitVectors(worldUp, worldNormal);
      // Posiciona a árvore exatamente sobre o ponto amostrado do terreno.
      object.position.set(localX, height, localZ);
      // Levanta um pouco a base da árvore para evitar que ela afunde no chão.
      object.position.addScaledVector(worldNormal, TREE_BASE_OFFSET);
      // Marca o objeto para remoção quando o tile for reconstruído.
      object.userData.isTree = true;

      // Registra a posição ocupada para manter distância mínima entre árvores.
      placedPositions.push({ x: localX, z: localZ });
    }
  }
}

/**
 * Retorna altura e normal interpoladas do terreno em uma posição normalizada.
 *
 * @param {THREE.BufferAttribute} positions
 * @param {THREE.BufferAttribute} normals
 * @param {number} u
 * @param {number} v
 * @param {number} cols
 * @returns {{height: number, normal: THREE.Vector3}}
 */
function sampleTerrainPoint(positions, normals, u, v, cols) {
  // Converte coordenadas normalizadas [0, 1] em índices fracionários na grade do terreno.
  const fx = Math.min(u * TILE_SEGMENTS, TILE_SEGMENTS - 0.001);
  const fz = Math.min(v * TILE_SEGMENTS, TILE_SEGMENTS - 0.001);

  // Identifica a célula da grade onde o ponto caiu e a parte fracionária dentro dela.
  const x0 = Math.floor(fx);
  const z0 = Math.floor(fz);
  // Vértice vizinho à direita e o de cima para fazer interpolação bilinear.
  const x1 = x0 + 1;
  const z1 = z0 + 1;
  // Frações internas da célula em X e Z.
  const tx = fx - x0;
  const tz = fz - z0;

  // Lê as alturas dos quatro cantos da célula.
  const h00 = positions.getZ(z0 * cols + x0);
  const h10 = positions.getZ(z0 * cols + x1);
  const h01 = positions.getZ(z1 * cols + x0);
  const h11 = positions.getZ(z1 * cols + x1);

  // Lê as normais correspondentes aos quatro cantos da célula.
  const n00 = new THREE.Vector3(normals.getX(z0 * cols + x0), normals.getY(z0 * cols + x0), normals.getZ(z0 * cols + x0));
  const n10 = new THREE.Vector3(normals.getX(z0 * cols + x1), normals.getY(z0 * cols + x1), normals.getZ(z0 * cols + x1));
  const n01 = new THREE.Vector3(normals.getX(z1 * cols + x0), normals.getY(z1 * cols + x0), normals.getZ(z1 * cols + x0));
  const n11 = new THREE.Vector3(normals.getX(z1 * cols + x1), normals.getY(z1 * cols + x1), normals.getZ(z1 * cols + x1));

  // Interpola a altura primeiro no eixo X e depois no eixo Z.
  const height0 = h00 + (h10 - h00) * tx;
  const height1 = h01 + (h11 - h01) * tx;
  const height = height0 + (height1 - height0) * tz;

  // Interpola as normais com a mesma lógica bilinear usada para a altura.
  const localNormal = new THREE.Vector3(
    n00.x * (1 - tx) * (1 - tz) + n10.x * tx * (1 - tz) + n01.x * (1 - tx) * tz + n11.x * tx * tz,
    n00.y * (1 - tx) * (1 - tz) + n10.y * tx * (1 - tz) + n01.y * (1 - tx) * tz + n11.y * tx * tz,
    n00.z * (1 - tx) * (1 - tz) + n10.z * tx * (1 - tz) + n01.z * (1 - tx) * tz + n11.z * tx * tz,
  ).normalize();

  // Converte a normal local do terreno para o espaço do mundo, considerando a rotação do plano.
  const worldNormal = localNormal.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2).normalize();

  // Retorna a altura e as duas versões da normal para usos diferentes.
  return { height, localNormal, worldNormal };
}
}
