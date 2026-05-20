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
import { carregarAviaoInimigo } from "./alienVerde.js"; // Certifique-se de usar o nome correto do arquivo
import { carregarAviaoInimigo2 } from "./oviniInimigo.js"; // Certifique-se de usar o nome correto do arquivo
import { initPauseMenu } from "./bottons.js"; // Importa o arquivo separado
import { LaserPool } from "./SistemaTiros.js";
import { CollisionManager } from "./CollisionManager.js"; // Novo Import

// Cor do céu — usada tanto no fundo do renderer quanto na névoa para fundir o horizonte
let baseColor = "rgb(148, 181, 224)";
let scene = new THREE.Scene();
scene.fog = new THREE.Fog(baseColor, 1, 400); // névoa linear: começa em z=1, some em z=400
let renderer = initRenderer();
renderer.setClearColor(baseColor); // fundo da tela igual à névoa

// Painel de FPS no canto da tela
const stats = new Stats();
document.getElementById("webgl-output").appendChild(stats.domElement);

/** @type {{ fogFar: number }} Parâmetros do GUI para controle (slider) da névoa. */
let fogParams = { fogFar: scene.fog.far };
let gui = new GUI();
// Slider que ajusta em tempo real até onde a névoa some os objetos
gui.add(fogParams, "fogFar", 50, 800, 1).onChange((value) => {
  scene.fog.far = value;
});

let light = initDefaultBasicLight(scene);
// FOV de 22° = zoom longo, parecido com câmera de perseguição de shoot-em-up
let camera = new THREE.PerspectiveCamera(22, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 25, -150); // começa atrás e na mesma altura do avião
camera.lookAt(0, 25, 0);
scene.add(camera);

// Registra o listener de mousemove para rastrear posição do cursor
initMouseTracking();

// Cria o modelo do avião e posiciona no centro da cena
const aviaoController = criaAviao(scene);
let aviaoMesh = aviaoController.object;
aviaoMesh.position.set(0, 25, 0);

//Inimigos
let inimigo;
carregarAviaoInimigo().then((aviao) => {
  aviao.scale.set(10, 10, 10);
  aviao.position.set(0, 20, 90);
  scene.add(aviao);
  inimigo = aviao;
});
let inimigo2;
carregarAviaoInimigo2().then((aviao) => {
  aviao.position.set(0, 42, 100);
  scene.add(aviao);
  inimigo2 = aviao;
});
//Vida dos Inimigos e do Jogador
let inimigosAbatidos = 0;
let vidaJogador = 100;
let aviaoBB = new THREE.Box3();

//Movimentação inimigo
let tempoInimigo = 0;

//Sistema de tiros
let laserPool = new LaserPool(scene, 30); // <--- Adicione o "= new LaserPool..."
//Tiros dos Inimigos
let inimigoTarget1 = { mesh: null, bb: new THREE.Box3(), ativo: false };
let inimigoTarget2 = { mesh: null, bb: new THREE.Box3(), ativo: false };
let listaInimigos = [inimigoTarget1, inimigoTarget2];

carregarAviaoInimigo().then((aviao) => {
  aviao.scale.set(10, 10, 10);
  aviao.position.set(0, 20, 90);
  scene.add(aviao);

  inimigo = aviao;

  inimigoTarget1.mesh = aviao;
  inimigoTarget1.ativo = true;
  inimigoTarget1.bb.setFromObject(aviao);
});

carregarAviaoInimigo2().then((aviao) => {
  aviao.position.set(0, 42, 100);
  scene.add(aviao);

  inimigo2 = aviao;

  inimigoTarget2.mesh = aviao;
  inimigoTarget2.ativo = true;
  inimigoTarget2.bb.setFromObject(aviao);
});

const inimigoCollisionManager = new CollisionManager("enemy");

//Avião atirando 
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !isPaused && aviaoMesh) {
    // Passa a posição E a rotação atual do avião
    laserPool.shoot(aviaoMesh.position, aviaoMesh.rotation);
  }
});

const jogadorCollisionManager = new CollisionManager(
  "player",
  (target, status) => {
    if (status.life <= 0) {
      console.log("GAME OVER! O avião foi destruído.");
      // isPaused = true; (Exemplo de lógica de fim de jogo)
    }
  },
);

//Telas de contador de tiros
const scoreElement = document.getElementById("score-counter");
const lifeElement = document.getElementById("player-life");

// Recalcula aspect ratio da câmera quando a janela muda de tamanho
window.addEventListener("resize", function () { onWindowResize(camera, renderer); }, false);

// Cria a grade de tiles de chão que vão rolar infinitamente
createWorldTiles(scene);

//Botao de Pause/Menu
const clock = new THREE.Clock();
let isPaused = false;
let gameSpeed = 1;

const pauseMenu = initPauseMenu({
  renderer: renderer,

  // Função para ler o estado atual
  getIsPaused: () => isPaused,

  // Função que muda a pausa, gerencia a tela e conserta o clock
  setPaused: (value) => {
    isPaused = value;
    pauseMenu.toggleDisplay(value); // Controla a div do outro arquivo
    if (!value) {
      clock.getDelta(); // descarta o delta acumulado durante a pausa
    }
    console.log("Jogo pausado:", isPaused);
  },

  getGameSpeed: () => gameSpeed,
  setGameSpeed: (value) => {
    gameSpeed = value;
    console.log("Nova velocidade do jogo via Teclado/Menu:", gameSpeed);
  }
});

render();

function render() {
  const delta = clock.getDelta(); // tempo em segundos desde o último frame
  
  if (!isPaused) {
    const scaledDelta = delta * gameSpeed;
    inputUpdate(aviaoMesh, camera, scaledDelta); // move o avião em direção ao mouse
    updateTiles(scaledDelta); // rola e recicla os tiles de chão
    updateCamera(camera, aviaoMesh, scaledDelta); // câmera segue o avião suavemente
    if (inimigo || inimigo2) {
      tempoInimigo += scaledDelta;
      const distanciaZ = Math.abs(camera.position.z - inimigo.position.z);

      const fovRadianos = (camera.fov * Math.PI) / 180;

      const alturaVisivel = 2 * Math.tan(fovRadianos / 2) * distanciaZ;

      const larguraTotalVisivel = alturaVisivel * camera.aspect;

      // Definimos a margem segura para o avião não sumir metade para fora da borda (ex: 85% da tela)
      const limiteBordaX = (larguraTotalVisivel / 2) * 0.85;

      // 2. APLICAÇÃO DO MOVIMENTO
      const velocidade = 1; // Velocidade do zigue-zague

      inimigo.position.x = Math.sin(tempoInimigo * velocidade) * limiteBordaX;
      inimigo.rotation.z = Math.cos(tempoInimigo * velocidade) * 0.2;

      inimigoTarget1.bb.setFromObject(inimigoTarget1.mesh);
      listaInimigos.push(inimigoTarget1);

      inimigo2.position.x = -Math.sin(tempoInimigo * 2 * velocidade) * limiteBordaX;
      inimigo2.rotation.z = Math.cos(tempoInimigo * velocidade) * -0.2;
      
      inimigoTarget2.bb.setFromObject(inimigoTarget2.mesh);
      listaInimigos.push(inimigoTarget2);
      
    }
    aviaoBB.setFromObject(aviaoMesh);
    laserPool.update(scaledDelta, scene.fog.far);

    inimigoCollisionManager.checkLaserAgainstTargets(
      laserPool.getActiveLasers(),
      listaInimigos,
      laserPool,
    );

    jogadorCollisionManager.checkPlayerAgainstTargets(aviaoBB, listaInimigos);
  }
  stats.update();                        // atualiza contador de FPS
  requestAnimationFrame(render);         // agenda o próximo frame
  renderer.render(scene, camera);        // desenha a cena na tela
}
