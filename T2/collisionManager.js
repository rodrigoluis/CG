// CollisionManager.js
import * as THREE from "three";

export class CollisionManager {
  /**
   * @param {String} type - Tipo: "player" (tiros recebidos) ou "enemy" (score).
   * @param {Function} onCollisionCallback - Código extra para rodar na main (opcional).
   */
  constructor(type, onCollisionCallback = null) {
    this.type = type;
    this.onCollisionCallback = onCollisionCallback;

    // Objeto estático global para que as instâncias compartilhem os dados de saldo
    if (typeof globalThis._gameStats === "undefined") {
      globalThis._gameStats = { enemy: 0, player: 0 };
    }

    this.score = 0;
    this.life = type === "player" ? 0 : 100; // Começa em 0 impactos se for o player

    this.uiElement = null;
    this._initUI();
  }

  /**
   * Cria os elementos HTML dinamicamente na tela (Encapsulamento da UI)
   * @private
   */
  _initUI() {
    let container = document.getElementById("game-arcade-ui");
    if (!container) {
      container = document.createElement("div");
      container.id = "game-arcade-ui";

      // Layout em linha com 20% do topo para manter o alinhamento que escolheu
      container.style.cssText = `
        position: fixed; 
        top: 25px; 
        left: 30%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: row;
        gap: 24px;
        font-family: 'Segoe UI', Roboto, sans-serif; 
        pointer-events: none; 
        z-index: 1000;
      `;
      document.body.appendChild(container);
    }

    this.uiElement = document.createElement("div");

    // O truque de mestre: Usamos a propriedade "order" do CSS para fixar a ordem exata na tela
    let ordemVisual = 0;

    if (this.type === "player") {
      ordemVisual = 1; // 1º à esquerda
      this.uiElement.id = "2life-box";
      this.uiElement.innerHTML = `
        <div style="font-size: 9px; font-weight: 800; color: #aaa; text-transform: uppercase; letter-spacing: 0.8px;">Status do Piloto</div>
        <div style="font-size: 16px; font-weight: 900; color: #1a1a1a; margin-top: 1px;">
          Tiros recebidos: <span id="ui-life-val" style="color: #1500ff;">0</span>
        </div>
      `;
    } else if (this.type === "enemy") {
      ordemVisual = 2; // 2º ao centro
      this.uiElement.id = "1score-box";
      this.uiElement.innerHTML = `
        <div style="font-size: 9px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.8px;">Placar de Combate</div>
        <div style="font-size: 16px; font-weight: 900; color: #1a1a1a; margin-top: 1px;">
          Inimigos derrotados: <span id="ui-score-val" style="color: #e06187;">0</span>
        </div>
      `;
    } else if (this.type === "saldo") {
      ordemVisual = 3; // 3º à direita
      this.uiElement.id = "3saldo-box";
      this.uiElement.innerHTML = `
        <div style="font-size: 9px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.8px;">Eficiência</div>
        <div style="font-size: 16px; font-weight: 900; color: #1a1a1a; margin-top: 1px;">
          Saldo de tiros: <span id="ui-saldo-val" style="color: #1a1a1a;">0</span>
        </div>
      `;
    }

    // Aplica o CSS padrão do estilo arcade com o modificador de ordem forçada
    this.uiElement.style.cssText = `
      background: rgba(255, 255, 255, 0.9);
      border: 3px solid #1a1a1a;
      border-radius: 12px;
      padding: 8px 14px;
      min-width: 160px;
      box-shadow: 4px 4px 0px #1a1a1a;
      display: flex;
      flex-direction: column;
      justify-content: center;
      order: ${ordemVisual}; /* Força o navegador a ordenar pelo número, ignorando o tempo do new */
    `;

    container.appendChild(this.uiElement);
  }

  /**
   * Executa a lógica de colisão e atualiza os contadores internos e visuais
   * @private
   */
  _registerHit(target) {
    if (this.type === "enemy") {
      this.score += 1;
      globalThis._gameStats.enemy = this.score; // Atualiza registro global

      const scoreVal = this.uiElement.querySelector("#ui-score-val");
      if (scoreVal) {
        scoreVal.innerText = this.score;
      }

      if (target) {
        // CORREÇÃO: Não mude 'ativo' para false e não mude 'visible' para false aqui!
        // Deixamos apenas a vida zerada para a main disparar o gatilho de queda.
        target.vida = 0;
        target.life = 0;
      }
    }

    if (this.type === "player") {
      this.life += 1;
      globalThis._gameStats.player = this.life; // Atualiza registro global

      const lifeVal = this.uiElement.querySelector("#ui-life-val");
      if (lifeVal) {
        lifeVal.innerText = this.life;
      }
    }

    if (this.onCollisionCallback) {
      this.onCollisionCallback(target, { score: this.score, life: this.life });
    }

    // Atualiza a caixa de saldo dinamicamente a cada acerto
    this._updateSaldoVisual();
  }

  /**
   * Recalcula o saldo de abates vs danos recebidos e altera a cor do texto condicionalmente
   * @private
   */
  _updateSaldoVisual() {
    const saldoSpan = document.getElementById("ui-saldo-val");
    if (saldoSpan) {
      const mortes = globalThis._gameStats.enemy;
      const danos = globalThis._gameStats.player;
      const resultado = mortes - danos;

      saldoSpan.innerText = resultado;

      // CONDIÇÃO DE COR: Se o saldo for menor que 0, fica vermelho. Caso contrário, preto padrão.
      if (resultado < 0) {
        saldoSpan.style.color = "#ff0000";
      } else {
        saldoSpan.style.color = "#23b500";
      }
    }
  }

  checkLaserAgainstTargets(
    activeLasers,
    targets,
    laserPool,
    camera = null,
    scene = null,
  ) {
    if (!activeLasers || !targets) return;

    for (let i = activeLasers.length - 1; i >= 0; i--) {
      let laser = activeLasers[i];
      if (!laser || !laser.active) continue;

      for (let j = 0; j < targets.length; j++) {
        let target = targets[j];
        if (!target) continue;

        // === AJUSTE DE RESOLUÇÃO DE ARQUITETURA ===
        const descobreMesh = target.mesh ? target.mesh : target;
        const descobreBB = target.bb
          ? target.bb
          : target.geometry
            ? new THREE.Box3().setFromObject(target)
            : null;

        const estaAtivo = target.ativo !== undefined ? target.ativo : true;
        const estaCaindo = target.caindo !== undefined ? target.caindo : false;

        // Se o alvo não estiver pronto para combate, ignora
        if (!estaAtivo || estaCaindo) continue;

        // Executa o teste de interseção física das Bounding Boxes
        if (laser.bb && descobreBB && laser.bb.intersectsBox(descobreBB)) {
          // === REGRA DO FOG BLINDADA ===
          if (camera && scene && scene.fog && descobreMesh) {
            const distanciaAteCamera = descobreMesh.position.distanceTo(
              camera.position,
            );

            // Se o inimigo estiver escondido além do limite da névoa, o tiro passa direto
            if (distanciaAteCamera > scene.fog.far) {
              continue;
            }
          }

          // === APLICAÇÃO DE DANOS ADAPTATIVA ===
          if (typeof target.takeDamage === "function") {
            target.takeDamage(10);
          } else if (
            descobreMesh.userData &&
            typeof descobreMesh.userData.takeDamage === "function"
          ) {
            descobreMesh.userData.takeDamage(10);
          } else {
            // Deduz os pontos de vida tanto no wrapper quanto na mesh por segurança
            if (target.vida !== undefined) target.vida -= 50;
            if (target.life !== undefined) target.life -= 50;
            if (descobreMesh.vida !== undefined) descobreMesh.vida -= 50;
            if (descobreMesh.life !== undefined) descobreMesh.life -= 50;
          }

          // === CORREÇÃO CRÍTICA: CHAMA O REGISTRO DE HIT DO FLUXO DO ARCADE ===
          // Registra o acerto para computar score/danos e atualizar a interface HTML!
          this._registerHit(target);

          // Recolhe o laser de volta ao pool após o impacto bem-sucedido
          laserPool.despawn(laser, i);
          break; // Sai do laço de alvos para este laser específico
        }
      }
    }
  }
  /**
   * Verifica colisão direta entre o avião do jogador e os alvos.
   */
  checkPlayerAgainstTargets(playerBB, targetList) {
    for (let j = 0; j < targetList.length; j++) {
      let target = targetList[j];

      if (target && target.ativo && target.mesh && target.bb) {
        if (playerBB.intersectsBox(target.bb)) {
          this._registerHit(target);
          break;
        }
      }
    }
  }
}
