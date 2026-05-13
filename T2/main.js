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

// Recalcula aspect ratio da câmera quando a janela muda de tamanho
window.addEventListener("resize", function () { onWindowResize(camera, renderer); }, false);

// Cria a grade de tiles de chão que vão rolar infinitamente
createWorldTiles(scene);

const clock = new THREE.Clock();
let isPaused = false;
let gameSpeed = 1;

const pauseOverlay = document.createElement("div");
pauseOverlay.style.position = "fixed";
pauseOverlay.style.inset = "0";
pauseOverlay.style.display = "none";
pauseOverlay.style.alignItems = "center";
pauseOverlay.style.justifyContent = "center";
pauseOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.45)";
pauseOverlay.style.color = "#ffffff";
pauseOverlay.style.zIndex = "10";
pauseOverlay.style.userSelect = "none";

const pausePanel = document.createElement("div");
pausePanel.style.display = "flex";
pausePanel.style.flexDirection = "column";
pausePanel.style.gap = "14px";
pausePanel.style.minWidth = "280px";
pausePanel.style.padding = "20px 22px";
pausePanel.style.borderRadius = "10px";
pausePanel.style.backgroundColor = "rgba(20, 24, 31, 0.92)";
pausePanel.style.border = "1px solid rgba(255, 255, 255, 0.15)";
pausePanel.style.boxShadow = "0 10px 28px rgba(0, 0, 0, 0.35)";

const pauseTitle = document.createElement("div");
pauseTitle.textContent = "PAUSADO";
pauseTitle.style.font = "700 30px/1.1 Arial, sans-serif";
pauseTitle.style.letterSpacing = "2px";
pauseTitle.style.textAlign = "center";

const speedLabel = document.createElement("div");
speedLabel.textContent = "Velocidade do jogo";
speedLabel.style.font = "600 14px/1.2 Arial, sans-serif";
speedLabel.style.opacity = "0.85";

const speedRow = document.createElement("div");
speedRow.style.display = "flex";
speedRow.style.alignItems = "center";
speedRow.style.gap = "8px";

const speedButtonBase = {
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  background: "#2a3242",
  color: "#ffffff",
  font: "600 13px/1 Arial, sans-serif",
  cursor: "pointer",
  flex: "1",
};

const speedButton1 = document.createElement("button");
speedButton1.textContent = "1.0x";
Object.assign(speedButton1.style, speedButtonBase);

const speedButton2 = document.createElement("button");
speedButton2.textContent = "2.0x";
Object.assign(speedButton2.style, speedButtonBase);

const speedButton3 = document.createElement("button");
speedButton3.textContent = "3.0x";
Object.assign(speedButton3.style, speedButtonBase);

const resumeButton = document.createElement("button");
resumeButton.textContent = "Resumir";
resumeButton.style.padding = "10px 12px";
resumeButton.style.borderRadius = "6px";
resumeButton.style.border = "1px solid rgba(255, 255, 255, 0.2)";
resumeButton.style.background = "#2f8f4e";
resumeButton.style.color = "#ffffff";
resumeButton.style.font = "600 14px/1 Arial, sans-serif";
resumeButton.style.cursor = "pointer";

const closeButton = document.createElement("button");
closeButton.textContent = "Fechar jogo";
closeButton.style.padding = "10px 12px";
closeButton.style.borderRadius = "6px";
closeButton.style.border = "1px solid rgba(255, 255, 255, 0.2)";
closeButton.style.background = "#a13d3d";
closeButton.style.color = "#ffffff";
closeButton.style.font = "600 14px/1 Arial, sans-serif";
closeButton.style.cursor = "pointer";

speedRow.appendChild(speedButton1);
speedRow.appendChild(speedButton2);
speedRow.appendChild(speedButton3);
pausePanel.appendChild(pauseTitle);
pausePanel.appendChild(speedLabel);
pausePanel.appendChild(speedRow);
pausePanel.appendChild(resumeButton);
pausePanel.appendChild(closeButton);
pauseOverlay.appendChild(pausePanel);
document.body.appendChild(pauseOverlay);

function updateSpeedButtons() {
  const activeColor = "#4b7cff";
  const inactiveColor = "#2a3242";
  speedButton1.style.background = gameSpeed === 1 ? activeColor : inactiveColor;
  speedButton2.style.background = gameSpeed === 2 ? activeColor : inactiveColor;
  speedButton3.style.background = gameSpeed === 3 ? activeColor : inactiveColor;
}

function setPaused(value) {
  isPaused = value;
  pauseOverlay.style.display = value ? "flex" : "none";
  if (!value) {
    clock.getDelta(); // descarta o delta acumulado durante a pausa
  }
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setPaused(true);
  }
});

renderer.domElement.addEventListener("pointerdown", () => {
  if (isPaused) {
    setPaused(false);
  }
});

pauseOverlay.addEventListener("pointerdown", () => {
  if (isPaused) {
    setPaused(false);
  }
});

pausePanel.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

resumeButton.addEventListener("click", () => {
  setPaused(false);
});

closeButton.addEventListener("click", () => {
  window.location.href = "../index.html";
});

speedButton1.addEventListener("click", () => {
  gameSpeed = 1;
  updateSpeedButtons();
});

speedButton2.addEventListener("click", () => {
  gameSpeed = 2;
  updateSpeedButtons();
});

speedButton3.addEventListener("click", () => {
  gameSpeed = 3;
  updateSpeedButtons();
});

updateSpeedButtons();

render();
/**
 * Loop de animação. Atualiza entrada, tiles, câmera e renderiza a cena.
 */
function render() {
  const delta = clock.getDelta(); // tempo em segundos desde o último frame
  if (!isPaused) {
    const scaledDelta = delta * gameSpeed;
    inputUpdate(aviaoMesh, camera, scaledDelta); // move o avião em direção ao mouse
    updateTiles(scaledDelta);                    // rola e recicla os tiles de chão
    updateCamera(camera, aviaoMesh, scaledDelta); // câmera segue o avião suavemente
  }
  stats.update();                        // atualiza contador de FPS
  requestAnimationFrame(render);         // agenda o próximo frame
  renderer.render(scene, camera);        // desenha a cena na tela
}
