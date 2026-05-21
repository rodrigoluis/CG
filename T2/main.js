/**
 * @file main.js
 * Ponto de entrada da cena. Inicializa renderer, cena, câmera, avião e loop de animação.
 */

import * as THREE from "three";
import Stats from "../../build/jsm/libs/stats.module.js";
import { criaAviao } from "./aviao.js";
import GUI from "../../libs/util/dat.gui.module.js";
import {
  initRenderer,
  initDefaultBasicLight,
  onWindowResize,
} from "../libs/util/util.js";
import { createWorldTiles, updateTiles } from "./tiles.js";
import { initMouseTracking, inputUpdate } from "./input.js";
import { updateCamera } from "./camera.js";
import { CriadorInimigos } from "./CriadorInimigos.js";
import { initPauseMenu } from "./bottons.js";
import { LaserPool } from "./SistemaTiros.js";
import { CollisionManager } from "./CollisionManager.js";
import { criaTarget } from "./target.js";
import { CONFIG } from "./Configuracao.js";
import { initSceneLighting } from "./light.js";

// Cor do céu — usada tanto no fundo do renderer quanto na névoa para fundir o horizonte
let baseColor = "rgb(148, 181, 224)";
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(baseColor, 1, 400);
let renderer = initRenderer();
renderer.setClearColor(baseColor);

// Painel de FPS no canto da tela
const stats = new Stats();
document.getElementById("webgl-output").appendChild(stats.domElement);

/** @type {{ fogFar: number }} Parâmetros do GUI para controle (slider) da névoa. */
let fogParams = { fogFar: scene.fog.far };
let gui = new GUI();
gui.add(fogParams, "fogFar", 50, 800, 1).onChange((value) => {
  scene.fog.far = value;
});

let camera = new THREE.PerspectiveCamera(
  22,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 25, -150);
camera.lookAt(0, 25, 0);
scene.add(camera);
let light = initSceneLighting(camera.near, camera.far, [camera.position.x, camera.position.y], scene, true);

initMouseTracking();

// Cria o modelo do avião e posiciona no centro da cena
const aviaoController = criaAviao(scene);
let aviaoMesh = aviaoController.object;
aviaoMesh.position.set(0, 32, 0);

//Target
const targetMesh = criaTarget(scene);

//População inimigo
let tempoInimigo = 0;
let listaInimigos = [];
const POPULACAO_TOTAL = 5;

const criadorInimigos = new CriadorInimigos(scene);

// Cria e armazena os 5 objetos no pool
// === COLOQUE ESTE BLOCO CORRIGIDO NO SEU LAÇO DE CRIAÇÃO (FOR) ===
for (let i = 0; i < POPULACAO_TOTAL; i++) {
  const ladoDoCanto = i % 2 === 0 ? -80 : 80;
  
  // DECLARAÇÃO CORRETA: Puxa a distância padrão de combate do seu CONFIG
  const posicaoZFixaDesteInimigo = CONFIG.inimigos.posicaoZCombate;

  criadorInimigos
    .criarInimigoAleatorio(ladoDoCanto, 25, posicaoZFixaDesteInimigo)
    .then((inimigoSorteado) => {
      inimigoSorteado.indice = i;

      // Injeta propriedades de vida iniciais garantidas para o CollisionManager
      inimigoSorteado.vida = 100;
      inimigoSorteado.life = 100;
      inimigoSorteado.destruido = false;
      if (inimigoSorteado.mesh) {
        inimigoSorteado.mesh.vida = 100;
        inimigoSorteado.mesh.life = 100;
      }

      // Sincroniza o offset inicial do pool com a distância fixa de combate original
      inimigoSorteado.offsetZAtual = posicaoZFixaDesteInimigo;

      listaInimigos.push(inimigoSorteado);

      if (i < 2) {
        inimigoSorteado.ativo = true;
        inimigoSorteado.mesh.visible = true;
      }
    });
}

// Vida dos Inimigos e do Jogador
let inimigosAbatidos = 0;
let aviaoBB = new THREE.Box3();

// Sistema de tiros
let laserPool = new LaserPool(scene, "player", "rgb(255, 25, 140)", 80);
let laserPoolInimigos = new LaserPool(scene, "enemy", "rgb(21, 0, 255)", 40);

const inimigoCollisionManager = new CollisionManager("enemy");
const saldoCollisionManager = new CollisionManager("saldo");

//Tiro dos inimigos
// --- COOLDOWN DE DISPARO DOS INIMIGOS ---
const INTERVALO_TIRO_INIMIGO = CONFIG.inimigos.intervaloTiro; // Tempo em segundos entre os tiros de cada inimigo

function gerenciarDisparoInimigos(scaledDelta, aviaoMesh) {
  if (!aviaoMesh || !camera) return;
  if (globalThis._shootEnabled === false) return;

  listaInimigos.forEach((inimigoTarget) => {
    if (!inimigoTarget.ativo || !inimigoTarget.mesh || inimigoTarget.caindo)
      return;

    // BLOQUEIO DE DISPARO PELA NÉVOA (FOG)
    const distanciaAteCamera = inimigoTarget.mesh.position.distanceTo(
      camera.position,
    );

    if (scene.fog && distanciaAteCamera > scene.fog.far) {
      return;
    }

    // Inicializa o relógio se ele não existir
    if (
      inimigoTarget.tempoRecarga === undefined ||
      inimigoTarget.tempoRecarga === null
    ) {
      inimigoTarget.tempoRecarga = CONFIG.inimigos.delayPrimeiroTiro;
    }

    // O tempo corre baseado no delta escalado (que já engloba o gameSpeed)
    inimigoTarget.tempoRecarga += scaledDelta;

    inimigoTarget.posicaoZOriginal = CONFIG.inimigos.posicaoZCombate;

    const intervaloAdaptado = CONFIG.inimigos.intervaloTiro / gameSpeed;

    if (inimigoTarget.tempoRecarga >= intervaloAdaptado) {
      let direcaoAlvo = new THREE.Vector3();
      direcaoAlvo.subVectors(aviaoMesh.position, inimigoTarget.mesh.position);

      laserPoolInimigos.shoot(inimigoTarget.mesh.position, direcaoAlvo);

      inimigoTarget.tempoRecarga = 0;
    }
  });
}

// Controle de entrada de tiros (Segurar botão)
let estáAtirando = false;
let tempoUltimoTiro = 0;
const CADENCIA_TIRO = CONFIG.lasers.cadenciaJogador;

window.addEventListener("mousedown", (event) => {
  if (event.button === 0) estáAtirando = true;
});
window.addEventListener("mouseup", (event) => {
  if (event.button === 0) estáAtirando = false;
});
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") estáAtirando = true;
});
window.addEventListener("keyup", (event) => {
  if (event.code === "Space") estáAtirando = false;
});
window.addEventListener("blur", () => {
  estáAtirando = false;
});

const jogadorCollisionManager = new CollisionManager(
  "player",
  (target, status) => {
    if (status.life <= 0) {
      console.log("GAME OVER! O avião foi destruído.");
    }
  },
);

const scoreElement = document.getElementById("score-counter");
const lifeElement = document.getElementById("player-life");

window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false,
);

createWorldTiles(scene);

const clock = new THREE.Clock();
let isPaused = false;
let gameSpeed = CONFIG.modos.velocidadeJogoPadrao;

const pauseMenu = initPauseMenu({
  renderer: renderer,
  getIsPaused: () => isPaused,
  setPaused: (value) => {
    isPaused = value;
    pauseMenu.toggleDisplay(value);
    if (!value) {
      clock.getDelta();
    }
  },
  getGameSpeed: () => gameSpeed,
  setGameSpeed: (value) => {
    gameSpeed = value;
  },
});

const _direcaoTiroJogador = new THREE.Vector3();

function gerenciarDisparoJogador(scaledDelta) {
  tempoUltimoTiro += scaledDelta;
  if (globalThis._shootEnabled === false) return;

  if (
    estáAtirando &&
    tempoUltimoTiro >= CADENCIA_TIRO &&
    targetMesh &&
    aviaoMesh
  ) {
    // 1. CALCULA O VETOR DE DIREÇÃO REAL: Direção que vai do avião direto para o Target
    _direcaoTiroJogador
      .subVectors(targetMesh.position, aviaoMesh.position)
      .normalize();

    // 2. DISPARO DO LASER: O tiro nasce na frente do avião e viaja apontado na direção da mira.
    // Isso garante o deslocamento completo tridimensional e faz os tiros atravessarem os colisores inimigos!
    laserPool.shoot(aviaoMesh.position, _direcaoTiroJogador);

    tempoUltimoTiro = 0;
  }
}

/**
 * Varre o pool de inimigos para gerenciar a animação de queda e reciclar
 */
function processarReciclagemInimigos() {
  listaInimigos.forEach((inimigoTarget) => {
    if (!inimigoTarget || !inimigoTarget.ativo) return;

    const meshInterna = inimigoTarget.mesh;
    if (!meshInterna) return;

    const foiAbatido =
      inimigoTarget.vida <= 0 ||
      inimigoTarget.life <= 0 ||
      inimigoTarget.destruido === true ||
      meshInterna.vida <= 0 ||
      meshInterna.life <= 0 ||
      (meshInterna.userData &&
        (meshInterna.userData.vida <= 0 || meshInterna.userData.life <= 0));

    if (foiAbatido && !inimigoTarget.caindo) {
      inimigoTarget.caindo = true;

      // ALERADO: De 6 para 25. Dá um tranco vertical para baixo instantâneo no momento do impacto!
      inimigoTarget.velocidadeQuedaY = 25;

      inimigoTarget.velocidadeGiro = Math.random() * 8 + 6; // Giros mais rápidos e agressivos

      inimigoTarget.destruido = false;
      if (meshInterna.userData) meshInterna.userData.destruido = false;
      return;
    }

    const bateuNoChao = meshInterna.position.y <= -20;
    const sumiuDaCena = !scene.children.includes(meshInterna);

    if (bateuNoChao || sumiuDaCena) {
      inimigoTarget.ativo = false;
      inimigoTarget.active = false;
      inimigoTarget.caindo = false;
      meshInterna.visible = false;
      inimigosAbatidos++;

      // Limpa dados de dano
      inimigoTarget.vida = 100;
      inimigoTarget.life = 100;
      inimigoTarget.destruido = false;
      meshInterna.vida = 100;
      meshInterna.life = 100;

      // CORREÇÃO: Força o offset de segurança alto para o próximo CriadorInimigos pescar limpo
      inimigoTarget.offsetZAtual = 800;
      inimigoTarget.posicaoZOriginal = 100;
      inimigoTarget.tempoRecarga = -2.0;

      if (sumiuDaCena) {
        scene.add(meshInterna);
      }
    }
  });
}

// Inicia o loop do jogo
render();

function render() {
  const delta = clock.getDelta();

  if (!isPaused) {
    const scaledDelta = delta * gameSpeed * 1.2;

    // 1. Atualização de Movimentação e Câmera
    inputUpdate(aviaoMesh, targetMesh, camera, scaledDelta); // Repassa o targetMesh para a física operar
    updateTiles(scaledDelta);
    updateCamera(camera, aviaoMesh, scaledDelta);

    if (aviaoMesh) {
      tempoInimigo += scaledDelta;
      criadorInimigos.atualizarMovimento(
        scaledDelta,
        aviaoMesh,
        camera,
        listaInimigos,
      );
    }

    // 2. Gerenciamento e Atualização de Projéteis
    aviaoBB.setFromObject(aviaoMesh);
    gerenciarDisparoJogador(scaledDelta);
    gerenciarDisparoInimigos(scaledDelta, aviaoMesh); 

    laserPool.update(scaledDelta, aviaoMesh, scene.fog.far);
    laserPoolInimigos.update(scaledDelta, aviaoMesh);

    listaInimigos.forEach((inimigo) => {
      if (inimigo.ativo && inimigo.mesh && inimigo.bb) {
        if (inimigo.caindo) {
          // Se já foi abatido e está na animação de queda, esvazia a caixa para o laser passar direto
          inimigo.bb.makeEmpty();
        } else {
          // Se está vivo e combatendo, atualiza o colisor normalmente
          inimigo.bb.setFromObject(inimigo.mesh);
        }
      }
    });

    // 2. Sistema de Colisões Filtrado apenas por naves que estão vivas e combatendo (NÃO CAINDO)
    const inimigosProntosParaColidir = listaInimigos.filter(
      (inimigo) => inimigo.ativo && !inimigo.caindo,
    );

    // Executa a colisão passando a lista protegida, a câmera e a cena
    inimigoCollisionManager.checkLaserAgainstTargets(
      laserPool.getActiveLasers(),
      inimigosProntosParaColidir,
      laserPool,
      camera,
      scene,
    );

    // 3. Sistema de Colisões Filtrado por naves vivas
    const meshesInimigasAtivas = listaInimigos
      .filter((inimigo) => inimigo.ativo && inimigo.mesh)
      .map((inimigo) => inimigo.mesh);

    inimigoCollisionManager.checkLaserAgainstTargets(
      laserPool.getActiveLasers(),
      inimigosProntosParaColidir,
      laserPool,
      camera,
      scene,
    );

    // Processa a morte e limpa os inimigos abatidos da tela
    processarReciclagemInimigos();

    jogadorCollisionManager.checkLaserAgainstTargets(
      laserPoolInimigos.getActiveLasers(),
      [{ ativo: true, mesh: aviaoMesh, bb: aviaoBB }], // Engana o sistema passando o jogador como alvo único
      laserPoolInimigos,
    );
  }
  
  stats.update();
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
