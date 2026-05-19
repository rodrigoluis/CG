// bottons.js

/**
 * Inicializa a interface de usuário do menu de pausa e injeta no DOM.
 * @param {Object} params
 * @param {Object} params.renderer - O renderizador do Three.js para capturar cliques na tela.
 * @param {Function} params.setPaused - Callback para alterar o estado de pausa na main.
 * @param {Function} params.getIsPaused - Callback para ler o estado de pausa da main.
 * @param {Function} params.setGameSpeed - Callback para alterar a velocidade na main.
 * @param {Function} params.getGameSpeed - Callback para ler a velocidade da main.
 */
export function initPauseMenu({
  renderer,
  setPaused,
  getIsPaused,
  setGameSpeed,
  getGameSpeed,
}) {
  // --- CRIANDO ELEMENTOS VISUAIS ---
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

  // Montando a árvore de elementos no DOM
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

  // --- FUNÇÃO INTERNA PARA SINALIZAR VELOCIDADE ATIVA ---
  function updateSpeedButtons() {
    const activeColor = "#4b7cff";
    const inactiveColor = "#2a3242";
    const currentSpeed = getGameSpeed();

    speedButton1.style.background =
      currentSpeed === 1 ? activeColor : inactiveColor;
    speedButton2.style.background =
      currentSpeed === 2 ? activeColor : inactiveColor;
    speedButton3.style.background =
      currentSpeed === 3 ? activeColor : inactiveColor;
  }

  // --- LISTENERS DE INTERAÇÃO DO MENU ---

  // Apenas UM listener de teclado para controlar tudo sem conflitos
  window.addEventListener("keydown", (event) => {
    // 1. TECLA ESCAPE (Pausa e despausa)
    if (event.key === "Escape") {
      setPaused(!getIsPaused());
      return; // Para a execução aqui para o código não ler as linhas de baixo
    }

    // 2. TECLAS DE VELOCIDADE (1, 2, 3)
    if (event.key === "1") {
      setGameSpeed(1);
      updateSpeedButtons();
    } else if (event.key === "2") {
      setGameSpeed(2);
      updateSpeedButtons();
    } else if (event.key === "3") {
      setGameSpeed(3);
      updateSpeedButtons();
    }
  });

  // Cliques do mouse na tela e nos botões visuais
  renderer.domElement.addEventListener("pointerdown", () => {
    if (getIsPaused()) {
      setPaused(false);
    }
  });

  pauseOverlay.addEventListener("pointerdown", () => {
    if (getIsPaused()) {
      setPaused(false);
    }
  });

  pausePanel.addEventListener("pointerdown", (event) => {
    event.stopPropagation(); // Impede que clicar dentro do painel despause o jogo
  });

  resumeButton.addEventListener("click", () => {
    setPaused(false);
  });

  closeButton.addEventListener("click", () => {
    window.location.href = "../index.html";
  });

  speedButton1.addEventListener("click", () => {
    setGameSpeed(1);
    updateSpeedButtons();
  });

  speedButton2.addEventListener("click", () => {
    setGameSpeed(2);
    updateSpeedButtons();
  });

  speedButton3.addEventListener("click", () => {
    setGameSpeed(3);
    updateSpeedButtons();
  });
  // Renderização inicial dos botões
  updateSpeedButtons();

  // Retorna métodos de controle visual para a main poder usar
  return {
    toggleDisplay: (value) => {
      pauseOverlay.style.display = value ? "flex" : "none";
    },
  };
}
