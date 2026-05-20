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
let inimigo = null;
let inimigo2 = null;
let tempoInimigo = 0;

// Configuração do atraso na perseguição (quanto menor, mais lento/atrasado o inimigo segue)
const VELOCIDADE_PERSEGUICAO = 2.0;

let inimigoTarget1 = { mesh: null, bb: new THREE.Box3(), ativo: false };
let inimigoTarget2 = { mesh: null, bb: new THREE.Box3(), ativo: false };
let listaInimigos = []; // Começa vazia e recebe os objetos estruturados

// Inicializa o criador passando a cena
const criadorInimigos = new CriadorInimigos(scene);

// Inimigo 1: Criado em Z fixo no horizonte (ex: 90)
criadorInimigos.criarInimigoAleatorio(0, 25, 90).then((inimigoSorteado1) => {
  inimigoTarget1 = inimigoSorteado1;
  inimigo = inimigoSorteado1.mesh;
  listaInimigos.push(inimigoTarget1); // Dá PUSH apenas uma vez aqui!
});

// Inimigo 2: Criado em outro Z fixo no horizonte (ex: 130)
criadorInimigos.criarInimigoAleatorio(0, 25, 130).then((inimigoSorteado2) => {
  inimigoTarget2 = inimigoSorteado2;
  inimigo2 = inimigoSorteado2.mesh;
  listaInimigos.push(inimigoTarget2); // Dá PUSH apenas uma vez aqui!
});

//Vida dos Inimigos e do Jogador
let inimigosAbatidos = 0;
let vidaJogador = 100;
let aviaoBB = new THREE.Box3();

//Movimentação inimigo
tempoInimigo = 0;

//Sistema de tiros
let laserPool = new LaserPool(scene, 30); // <--- Adicione o "= new LaserPool..."
//Tiros dos Inimigos
inimigoTarget1 = { mesh: null, bb: new THREE.Box3(), ativo: false };
inimigoTarget2 = { mesh: null, bb: new THREE.Box3(), ativo: false };
listaInimigos = [inimigoTarget1, inimigoTarget2];

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
    if (aviaoMesh) {
      tempoInimigo += scaledDelta; // Incrementa o tempo para o zigue-zague

      // 1. CÁLCULO DINÂMICO DA BORDA DA TELA (Baseado no FOV e na distância Z)
      const fovRadianos = (camera.fov * Math.PI) / 180;
      const velocidadeZigueZague = 1.2; // Controla a velocidade do balanço lateral

      // Movimentação do Inimigo 1
      // --- Movimentação do Inimigo 1 ---
      if (aviaoMesh) {
      tempoInimigo += scaledDelta; // Incrementa o tempo para o zigue-zague

      const fovRadianos = (camera.fov * Math.PI) / 180;
      const velocidadeZigueZague = 1.4; // Ajusta o ritmo do balanço lateral

      // --- Movimentação do Inimigo 1 ---
      if (inimigoTarget1 && inimigoTarget1.ativo && inimigo) {
        const distanciaZ1 = Math.abs(camera.position.z - (aviaoMesh.position.z + 90));
        const alturaVisivel1 = 3 * Math.tan(fovRadianos / 2) * distanciaZ1;
        const limiteBordaX1 = ((alturaVisivel1 * camera.aspect) / 1.5) * 0.85;

        // MELHORIA: A oscilação acontece EM VOLTA do X do avião
        // Multiplicamos por 0.4 para ele cobrir um bom espaço ao seu redor sem fugir instantaneamente
        let desvioX = Math.sin(tempoInimigo * velocidadeZigueZague) * (limiteBordaX1 * 0.4);
        let destinoX = THREE.MathUtils.clamp(aviaoMesh.position.x + desvioX, -limiteBordaX1, limiteBordaX1);

        // Guarda a posição anterior para calcular a inclinação física real
        let posXAnterior = inimigo.position.x;

        inimigo.position.x = THREE.MathUtils.lerp(inimigo.position.x, destinoX, scaledDelta * VELOCIDADE_PERSEGUICAO);
        inimigo.position.y = THREE.MathUtils.lerp(inimigo.position.y, aviaoMesh.position.y - 5, scaledDelta * VELOCIDADE_PERSEGUICAO);
        inimigo.position.z = aviaoMesh.position.z + 90;

        // MELHORIA: Inclinação baseada na velocidade real do movimento lateral (Efeito Inércia)
        let velocidadeXReal = (inimigo.position.x - posXAnterior) / scaledDelta;
        inimigo.rotation.z = THREE.MathUtils.lerp(inimigo.rotation.z, -velocidadeXReal * 0.01, scaledDelta * 5);

        inimigoTarget1.bb.setFromObject(inimigo);
      }

      // --- Movimentação do Inimigo 2 ---
      if (inimigoTarget2 && inimigoTarget2.ativo && inimigo2) {
        const distanciaZ2 = Math.abs(camera.position.z - (aviaoMesh.position.z + 130));
        const alturaVisivel2 = 4.5 * Math.tan(fovRadianos / 2) * distanciaZ2;
        const limiteBordaX2 = ((alturaVisivel2 * camera.aspect) / 1.5) * 0.85;

        // MELHORIA: Oscila em sentido oposto, mas também rastreando o centro do seu avião
        let desvioX = -Math.sin(tempoInimigo * 1.3 * velocidadeZigueZague) * (limiteBordaX2 * 0.4);
        let destinoX = THREE.MathUtils.clamp(aviaoMesh.position.x + desvioX, -limiteBordaX2, limiteBordaX2);

        let posXAnterior = inimigo2.position.x;

        inimigo2.position.x = THREE.MathUtils.lerp(inimigo2.position.x, destinoX, scaledDelta * (VELOCIDADE_PERSEGUICAO * 0.8));
        inimigo2.position.y = THREE.MathUtils.lerp(inimigo2.position.y, aviaoMesh.position.y + 20, scaledDelta * (VELOCIDADE_PERSEGUICAO * 0.8));
        inimigo2.position.z = aviaoMesh.position.z + 130;

        // MELHORIA: Inclinação baseada na velocidade real para o segundo inimigo
        let velocidadeXReal = (inimigo2.position.x - posXAnterior) / scaledDelta;
        inimigo2.rotation.z = THREE.MathUtils.lerp(inimigo2.rotation.z, -velocidadeXReal * 0.01, scaledDelta * 5);

        inimigoTarget2.bb.setFromObject(inimigo2);
      }
    }
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
