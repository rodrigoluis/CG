// bottons.js

/**
 * Inicializa a interface de usuário do menu de pausa e injeta no DOM com paleta Pastel.
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
  pauseOverlay.style.backgroundColor = "rgba(61, 64, 91, 0.4)"; // Sombra usando o tom grafite suave da paleta
  pauseOverlay.style.zIndex = "10";
  pauseOverlay.style.userSelect = "none";

  const pausePanel = document.createElement("div");
  pausePanel.style.display = "flex";
  pausePanel.style.flexDirection = "column";
  pausePanel.style.gap = "16px";
  pausePanel.style.minWidth = "290px";
  pausePanel.style.padding = "24px 26px";
  pausePanel.style.borderRadius = "14px";
  pausePanel.style.backgroundColor = "#fbf8f3"; // Creme suave da imagem enviada
  pausePanel.style.border = "2px solid #3d405b"; // Borda fina no tom grafite elegante
  pausePanel.style.boxShadow = "0 12px 30px rgba(61, 64, 91, 0.15)";

  const pauseTitle = document.createElement("div");
  pauseTitle.textContent = "PAUSADO";
  pauseTitle.style.font = "800 28px/1.1 'Arial Rounded MT Bold', sans-serif";
  pauseTitle.style.letterSpacing = "3px";
  pauseTitle.style.textAlign = "center";
  pauseTitle.style.color = "#e06187"; // Texto Grafite

  const speedLabel = document.createElement("div");
  speedLabel.textContent = "Velocidade do Jogo";
  speedLabel.style.font = "700 13px/1.2 sans-serif";
  speedLabel.style.color = "#7d809b"; // Grafite médio/atenuado
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
    background: "#ffffff", // Branco limpo
    color: "#3d405b", // Texto grafite por padrão
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

  const resumeButton = document.createElement("button");
  resumeButton.textContent = "Resumir";
  resumeButton.style.padding = "12px 12px";
  resumeButton.style.borderRadius = "8px";
  resumeButton.style.border = "none";
  resumeButton.style.background = "#1f6494"; // Atualizado para o azul clássico
  resumeButton.style.color = "#ffffff";
  resumeButton.style.font = "800 14px/1 sans-serif";
  resumeButton.style.cursor = "pointer";
  resumeButton.style.boxShadow = "0 3px 6px rgba(31, 100, 148, 0.4)"; // Sombra combinando com o novo azul

  const closeButton = document.createElement("button");
  closeButton.textContent = "Fechar Jogo";
  closeButton.style.padding = "12px 12px";
  closeButton.style.borderRadius = "8px";
  closeButton.style.border = "none";
  closeButton.style.background = "#d6213b"; // Corrigido: apenas uma hashtag!
  closeButton.style.color = "#ffffff";
  closeButton.style.font = "800 14px/1 sans-serif";
  closeButton.style.cursor = "pointer";
  closeButton.style.boxShadow = "0 3px 6px rgba(214, 33, 59, 0.4)"; // Sombra suave usando o mesmo tom de vermelho

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
    const activeColor = "#f2d925"; // Rosa Pastel Fofo e delicado pedido
    const activeTextColor = "#3d405b"; // Mantém o texto grafite para legibilidade elegante
    const inactiveColor = "#ffffff"; // Branco Puro

    const currentSpeed = getGameSpeed();

    speedButton1.style.background =
      currentSpeed === 1 ? activeColor : inactiveColor;
    speedButton1.style.borderColor = currentSpeed === 1 ? "#3d405b" : "#d1d3dc";
    speedButton1.style.color = activeTextColor;

    speedButton2.style.background =
      currentSpeed === 2 ? activeColor : inactiveColor;
    speedButton2.style.borderColor = currentSpeed === 2 ? "#3d405b" : "#d1d3dc";
    speedButton2.style.color = activeTextColor;

    speedButton3.style.background =
      currentSpeed === 3 ? activeColor : inactiveColor;
    speedButton3.style.borderColor = currentSpeed === 3 ? "#3d405b" : "#d1d3dc";
    speedButton3.style.color = activeTextColor;
  }

  // --- LISTENERS DE INTERAÇÃO DO MENU ---

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setPaused(!getIsPaused());
      return;
    }

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
    event.stopPropagation();
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

  updateSpeedButtons();

  return {
    toggleDisplay: (value) => {
      pauseOverlay.style.display = value ? "flex" : "none";
    },
  };
}
