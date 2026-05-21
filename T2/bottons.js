// bottons.js
import { CONFIG } from "./Configuracao.js";

/**
 * Inicializa a interface de usuário do menu de pausa e a tela de início Hello Kitty World.
 */
export function initPauseMenu({
  renderer,
  setPaused,
  getIsPaused,
  setGameSpeed,
  getGameSpeed,
}) {
  // Inicializa o estado global dos tiros se não existir (começa ativado)
  if (typeof globalThis._shootEnabled === "undefined") {
    globalThis._shootEnabled = true;
  }

  // Força o jogo a começar pausado para a tela de início aparecer antes de tudo
  setTimeout(() => {
    setPaused(true);
  }, 10);

  // =========================================================================
  // 1. TELA DE INÍCIO: HELLO KITTY WORLD (SEM EMOJIS)
  // =========================================================================
  const startOverlay = document.createElement("div");
  startOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(148, 181, 224);
    z-index: 2000;
    user-select: none;
    font-family: 'Segoe UI', Roboto, sans-serif;
  `;

  const startPanel = document.createElement("div");
  startPanel.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    min-width: 320px;
    padding: 40px 30px;
    border-radius: 20px;
    background-color: #fbf8f3;
    border: 4px solid #3d405b;
    box-shadow: 8px 8px 0px #3d405b;
    text-align: center;
  `;

  const startTitle = document.createElement("div");
  startTitle.innerHTML = `
    <span style="color: #e06187; display: block; font-size: 16px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">Bem-vindo ao</span>
    <span style="color: #1f6494; font: 900 36px/1.1 'Arial Rounded MT Bold', sans-serif; letter-spacing: 1px;">HELLO KITTY<br><span style="color: #e06187;">WORLD</span></span>
  `;

  // O Botão de Play Estilizado Puro Texto
  const playButton = document.createElement("button");
  playButton.textContent = "JOGAR";
  playButton.style.cssText = `
    padding: 16px 40px;
    font-size: 20px;
    font-weight: 900;
    font-family: 'Arial Rounded MT Bold', sans-serif;
    color: #3d405b;
    background-color: #f2d925;
    border: 3px solid #3d405b;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 4px 4px 0px #3d405b;
    transition: all 0.1s ease-in-out;
    letter-spacing: 1px;
  `;

  // Efeito de clique físico no botão (estilo Arcade)
  playButton.addEventListener(
    "mouseenter",
    () => (playButton.style.transform = "scale(1.05)"),
  );
  playButton.addEventListener(
    "mouseleave",
    () => (playButton.style.transform = "scale(1)"),
  );
  playButton.addEventListener("mousedown", () => {
    playButton.style.transform = "translate(2px, 2px)";
    playButton.style.boxShadow = "2px 2px 0px #3d405b";
  });

  // Evento que inicia a partida
  playButton.addEventListener("click", () => {
    startOverlay.style.display = "none";
    setPaused(false);
  });

  startPanel.appendChild(startTitle);
  startPanel.appendChild(playButton);
  startOverlay.appendChild(startPanel);
  document.body.appendChild(startOverlay);

  // =========================================================================
  // 2. CONSTRUÇÃO DO MENU DE PAUSA (SEM EMOJIS)
  // =========================================================================
  const pauseOverlay = document.createElement("div");
  pauseOverlay.style.position = "fixed";
  pauseOverlay.style.inset = "0";
  pauseOverlay.style.display = "none";
  pauseOverlay.style.alignItems = "center";
  pauseOverlay.style.justifyContent = "center";
  pauseOverlay.style.backgroundColor = "rgba(61, 64, 91, 0.4)";
  pauseOverlay.style.zIndex = "10";
  pauseOverlay.style.userSelect = "none";

  const pausePanel = document.createElement("div");
  pausePanel.style.display = "flex";
  pausePanel.style.flexDirection = "column";
  pausePanel.style.gap = "16px";
  pausePanel.style.minWidth = "290px";
  pausePanel.style.padding = "24px 26px";
  pausePanel.style.borderRadius = "14px";
  pausePanel.style.backgroundColor = "#fbf8f3";
  pausePanel.style.border = "2px solid #3d405b";
  pausePanel.style.boxShadow = "0 12px 30px rgba(61, 64, 91, 0.15)";

  const pauseTitle = document.createElement("div");
  pauseTitle.textContent = "PAUSADO";
  pauseTitle.style.font = "800 28px/1.1 'Arial Rounded MT Bold', sans-serif";
  pauseTitle.style.letterSpacing = "3px";
  pauseTitle.style.textAlign = "center";
  pauseTitle.style.color = "#e06187";

  const speedLabel = document.createElement("div");
  speedLabel.textContent = "Velocidade do Jogo";
  speedLabel.style.font = "700 13px/1.2 sans-serif";
  speedLabel.style.color = "#7d809b";
  speedLabel.style.textAlign = "center";
  speedLabel.style.textTransform = "uppercase";
  speedLabel.style.letterSpacing = "1px";

  const speedRow = document.createElement("div");
  speedRow.style.display = "flex";
  speedRow.style.alignItems = "center";
  speedRow.style.gap = "8px";

  const speedButtonBase = {
    padding: "10px 10px",
    borderRadius: "8px",
    border: "1.5px solid #3d405b",
    background: "#ffffff",
    color: "#3d405b",
    font: "800 13px/1 sans-serif",
    cursor: "pointer",
    flex: "1",
    transition: "all 0.15s ease-in-out",
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

  const toggleShootingButton = document.createElement("button");
  toggleShootingButton.style.padding = "12px 12px";
  toggleShootingButton.style.borderRadius = "8px";
  toggleShootingButton.style.border = "1.5px solid #f4b900";
  toggleShootingButton.style.font = "800 14px/1 sans-serif";
  toggleShootingButton.style.cursor = "pointer";
  toggleShootingButton.style.transition = "all 0.15s ease-in-out";

  const resumeButton = document.createElement("button");
  resumeButton.textContent = "Resumir";
  resumeButton.style.padding = "12px 12px";
  resumeButton.style.borderRadius = "8px";
  resumeButton.style.border = "none";
  resumeButton.style.background = "#1f6494";
  resumeButton.style.color = "#ffffff";
  resumeButton.style.font = "800 14px/1 sans-serif";
  resumeButton.style.cursor = "pointer";
  resumeButton.style.boxShadow = "0 3px 6px rgba(31, 100, 148, 0.4)";

  const closeButton = document.createElement("button");
  closeButton.textContent = "Reiniciar Jogo";
  closeButton.style.padding = "12px 12px";
  closeButton.style.borderRadius = "8px";
  closeButton.style.border = "none";
  closeButton.style.background = "#d6213b";
  closeButton.style.color = "#ffffff";
  closeButton.style.font = "800 14px/1 sans-serif";
  closeButton.style.cursor = "pointer";
  closeButton.style.boxShadow = "0 3px 6px rgba(214, 33, 59, 0.4)";

  speedRow.appendChild(speedButton1);
  speedRow.appendChild(speedButton2);
  speedRow.appendChild(speedButton3);
  pausePanel.appendChild(pauseTitle);
  pausePanel.appendChild(speedLabel);
  pausePanel.appendChild(speedRow);
  pausePanel.appendChild(toggleShootingButton);
  pausePanel.appendChild(resumeButton);
  pausePanel.appendChild(closeButton);
  pauseOverlay.appendChild(pausePanel);
  document.body.appendChild(pauseOverlay);

  // --- FUNÇÃO INTERNA PARA SINALIZAR VELOCIDADE ATIVA ---
  function updateSpeedButtons() {
    const activeColor = "#f2d925";
    const activeTextColor = "#3d405b";
    const inactiveColor = "#ffffff";

    const currentSpeed = getGameSpeed();

    const s1 = CONFIG.modos.velocidadeTecla1;
    const s2 = CONFIG.modos.velocidadeTecla2;
    const s3 = CONFIG.modos.velocidadeTecla3;

    speedButton1.style.background =
      currentSpeed === s1 ? activeColor : inactiveColor;
    speedButton1.style.borderColor =
      currentSpeed === s1 ? "#3d405b" : "#d1d3dc";
    speedButton1.style.color = activeTextColor;

    speedButton2.style.background =
      currentSpeed === s2 ? activeColor : inactiveColor;
    speedButton2.style.borderColor =
      currentSpeed === s2 ? "#3d405b" : "#d1d3dc";
    speedButton2.style.color = activeTextColor;

    speedButton3.style.background =
      currentSpeed === s3 ? activeColor : inactiveColor;
    speedButton3.style.borderColor =
      currentSpeed === s3 ? "#3d405b" : "#d1d3dc";
    speedButton3.style.color = activeTextColor;
  }

  function updateShootingButton() {
    if (globalThis._shootEnabled) {
      toggleShootingButton.textContent = "Tiros: Ativados";
      toggleShootingButton.style.background = "#fbe750";
      toggleShootingButton.style.color = "#3d405b";
      toggleShootingButton.style.boxShadow = "0 3px 6px #f2d925";
    } else {
      toggleShootingButton.textContent = "Tiros: Desativados";
      toggleShootingButton.style.background = "#cb1e2b";
      toggleShootingButton.style.color = "#ffffff";
      toggleShootingButton.style.boxShadow = "none";
    }
  }

  // --- LISTENERS DE INTERAÇÃO DO MENU ---

  window.addEventListener("keydown", (event) => {
    if (startOverlay.style.display !== "none") return;

    if (event.key === "Escape") {
      setPaused(!getIsPaused());
      return;
    }

    if (event.key === "1") {
      setGameSpeed(CONFIG.modos.velocidadeTecla1);
      updateSpeedButtons();
    } else if (event.key === "2") {
      setGameSpeed(CONFIG.modos.velocidadeTecla2);
      updateSpeedButtons();
    } else if (event.key === "3") {
      setGameSpeed(CONFIG.modos.velocidadeTecla3);
      updateSpeedButtons();
    }
  });

  renderer.domElement.addEventListener("pointerdown", () => {
    if (startOverlay.style.display !== "none") return;
    if (getIsPaused()) setPaused(false);
  });

  pauseOverlay.addEventListener("pointerdown", () => {
    if (startOverlay.style.display !== "none") return;
    if (getIsPaused()) setPaused(false);
  });

  pausePanel.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  toggleShootingButton.addEventListener("click", () => {
    globalThis._shootEnabled = !globalThis._shootEnabled;
    updateShootingButton();
  });

  resumeButton.addEventListener("click", () => {
    setPaused(false);
  });

  closeButton.addEventListener("click", () => {
    window.location.reload();
  });

  speedButton1.addEventListener("click", () => {
    setGameSpeed(CONFIG.modos.velocidadeTecla1);
    updateSpeedButtons();
  });

  speedButton2.addEventListener("click", () => {
    setGameSpeed(CONFIG.modos.velocidadeTecla2);
    updateSpeedButtons();
  });

  speedButton3.addEventListener("click", () => {
    setGameSpeed(CONFIG.modos.velocidadeTecla3);
    updateSpeedButtons();
  });

  updateSpeedButtons();
  updateShootingButton();

  return {
    toggleDisplay: (value) => {
      if (startOverlay.style.display !== "none") return;
      pauseOverlay.style.display = value ? "flex" : "none";
    },
  };
}
