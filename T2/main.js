/**
 * @file main.js
 * Ponto de entrada da cena. Inicializa renderer, cena, câmera, avião e loop de animação.
 */

import * as THREE from "three";
import Stats from "../../build/jsm/libs/stats.module.js";
import { criaAviao } from "./aviao.js";
import GUI from "../../libs/util/dat.gui.module.js";
import {
  onWindowResize,
} from "../libs/util/util.js";
import { createWorldTiles, updateTiles } from "./tiles.js";
import { initMouseTracking, inputUpdate } from "./input.js";
import { updateCamera } from "./camera.js";
import { CriadorInimigos } from "./criadorInimigos.js";
import { initPauseMenu, initUI } from "./menu.js";
import { LaserPool } from "./sistemaTiros.js";
import { CollisionManager } from "./collisionManager.js";
import { criaTarget } from "./target.js";
import { CONFIG } from "./config.js";
import { initSceneLighting, updateLightVolume } from "./light.js";
import { startRenderer } from "./renderer.js";

// Cor do céu — usada tanto no fundo do renderer quanto na névoa para fundir o horizonte
const BASE_COLOR = "rgb(148, 181, 224)";
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(BASE_COLOR, 1, 1500);
let renderer = startRenderer(BASE_COLOR, THREE.PCFShadowMap);

// Painel de FPS no canto da tela
const stats = new Stats();
document.getElementById("webgl-output").appendChild(stats.domElement);

let gui = new GUI();

const altitudeParams = { altitude: 0 };
gui.add(altitudeParams, "altitude").name("Altitude").listen();

// FOV de 22° = zoom longo, parecido com câmera de perseguição de shoot-em-up
let camera = new THREE.PerspectiveCamera(22, window.innerWidth / window.innerHeight, 0.1, 2100);
camera.position.set(0, 105, -150); // começa atrás e na mesma altura do avião
camera.lookAt(0, 120, 0);
scene.add(camera);

let light = initSceneLighting(camera, scene);

/** @type {{ fogFar: number }} Parâmetros do GUI para controle (slider) da névoa. */
let fogParams = { fogFar: scene.fog.far };
gui.add(fogParams, "fogFar", 50, 2000, 1).onChange((value) => {
  scene.fog.far = value;
  updateLightVolume(light, camera, value);
});


initMouseTracking();

// Cria o modelo do avião e posiciona no centro da cena
const aviaoController = criaAviao(scene);
let aviaoMesh = aviaoController.object;
aviaoMesh.position.set(0, CONFIG.input.planeBaseY, 0);

//Target
const targetMesh = criaTarget(scene);
targetMesh.position.set(0, CONFIG.input.planeBaseY, 140);

//População inimigo
let tempoInimigo = 0;
let listaInimigos = [];
const POPULACAO_TOTAL = 5;

const criadorInimigos = new CriadorInimigos(scene);

for (let i = 0; i < POPULACAO_TOTAL; i++) {
  const ladoDoCanto = i % 2 === 0 ? -80 : 80;
  const posicaoZFixaDesteInimigo = CONFIG.inimigos.posicaoZCombate;

  const inimigoSorteado = await criadorInimigos.criarInimigoAleatorio(
    ladoDoCanto,
    CONFIG.input.planeBaseY,
    posicaoZFixaDesteInimigo,
  );

  inimigoSorteado.indice = i;
  inimigoSorteado.life = 100;
  inimigoSorteado.destruido = false;
  if (inimigoSorteado.mesh) {
    inimigoSorteado.mesh.life = 100;
  }

  inimigoSorteado.offsetZAtual = posicaoZFixaDesteInimigo;
  listaInimigos.push(inimigoSorteado);

  if (i < 2) {
    inimigoSorteado.ativo = true;
    inimigoSorteado.mesh.visible = true;
  }
}

// Vida dos Inimigos e do Jogador
let inimigosAbatidos = 0;
let aviaoBB = new THREE.Box3();

// Sistema de tiros
let laserPool = new LaserPool(scene, "player", "rgb(255, 25, 140)", 80);
let laserPoolInimigos = new LaserPool(scene, "enemy", "rgb(21, 0, 255)", 40);

const hud = initUI();
const inimigoCollisionManager = new CollisionManager("enemy", null, hud);

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
let estaAtirando = false;
let tempoUltimoTiro = 0;
const CADENCIA_TIRO = CONFIG.lasers.cadenciaJogador;

globalThis.addEventListener("mousedown", (event) => {
  if (event.button === 0) estaAtirando = true;
});
globalThis.addEventListener("mouseup", (event) => {
  if (event.button === 0) estaAtirando = false;
});
globalThis.addEventListener("keydown", (event) => {
  if (event.code === "Space") estaAtirando = true;
});
globalThis.addEventListener("keyup", (event) => {
  if (event.code === "Space") estaAtirando = false;
});
globalThis.addEventListener("blur", () => {
  estaAtirando = false;
});

const jogadorCollisionManager = new CollisionManager(
  "player",
  (target, status) => {
    if (status.life <= 0) {
      console.log("GAME OVER! O avião foi destruído.");
    }
  },
  hud,
);

window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
    updateLightVolume(light, camera, scene.fog.far);
  },
  false,
);

createWorldTiles(scene);

const clock = new THREE.Clock();
let isPaused = false;
let gameSpeed = CONFIG.modos.velocidadeJogoPadrao;

if (!CONFIG.DISABLE_START_MENU) {
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
}

const _direcaoTiroJogador = new THREE.Vector3();

function gerenciarDisparoJogador(scaledDelta) {
  tempoUltimoTiro += scaledDelta;
  if (globalThis._shootEnabled === false) return;

  if (
    estaAtirando &&
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
    if (!inimigoTarget?.ativo) return;

    const meshInterna = inimigoTarget.mesh;
    if (!meshInterna) return;

    const foiAbatido =
      inimigoTarget.life <= 0 ||
      inimigoTarget.destruido === true ||
      meshInterna.life <= 0 ||
      (meshInterna.userData &&
        (meshInterna.userData.life <= 0));

    // 1. ATIVA QUEDA
    if (foiAbatido && !inimigoTarget.caindo) {
      inimigoTarget.caindo = true;
      inimigoTarget.velocidadeQuedaY = 25;
      inimigoTarget.velocidadeGiro = Math.random() * 8 + 6;

      if (meshInterna.userData) meshInterna.userData.destruido = false;
      return;
    }

    // 2. RECICLAGEM REAL: Quando o objeto cai abaixo do cenário, reseta e oculta de forma limpa
    const bateuNoChao = meshInterna.position.y <= -20;

    if (bateuNoChao) {
      inimigoTarget.ativo = false;
      inimigoTarget.active = false;
      inimigoTarget.caindo = false;
      meshInterna.visible = false; // Esconde visualmente
      inimigosAbatidos++;

      // Reseta os dados de integridade estrutural
      inimigoTarget.life = 100;
      inimigoTarget.destruido = false;
      meshInterna.life = 100;

      // Coloca de volta no pool na distância segura do horizonte
      inimigoTarget.offsetZAtual = CONFIG.inimigos.distanciaSpawnZ;
      inimigoTarget.posicaoZOriginal = CONFIG.inimigos.posicaoZCombate;
      inimigoTarget.tempoRecarga = CONFIG.inimigos.delayPrimeiroTiro;
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

    // Executa a colisão uma única vez passando os parâmetros necessários
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
  altitudeParams.altitude = Math.round(aviaoMesh.position.y);
  stats.update();                        // atualiza contador de FPS
  requestAnimationFrame(render);         // agenda o próximo frame
  renderer.render(scene, camera);        // desenha a cena na tela
}
