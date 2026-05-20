// CollisionManager.js
import * as THREE from "three";

export class CollisionManager {
  /**
   * @param {String} type - Tipo: "player" (vida do avião) ou "enemy" (score).
   * @param {Function} onCollisionCallback - Função extra (ex: acionar tela de Game Over).
   */
  constructor(type, onCollisionCallback = null) {
    this.type = type;
    this.onCollisionCallback = onCollisionCallback;

    this.score = 0;
    this.life = 100;

    this.uiElement = null;
    this.lifeBarInner = null;

    this._initUI();
  }

  /**
   * Monta uma interface de jogo estilizada (Estética Fofa/Arcade Moderno)
   * @private
   */
  _initUI() {
    let container = document.getElementById("game-arcade-ui");
    if (!container) {
      container = document.createElement("div");
      container.id = "game-arcade-ui";
      container.style.cssText = `
        position: fixed; 
        top: 25px; 
        left: 20%;
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
    this.uiElement.style.cssText = `
      background: rgba(255, 255, 255, 0.9);
      border: 3px solid #1a1a1a;
      border-radius: 12px;
      padding: 12px 18px;
      min-width: 160px;
      box-shadow: 4px 4px 0px #1a1a1a;
      display: flex;
      flex-direction: column;
      justify-content: center;
    `;

    if (this.type === "enemy") {
      this.uiElement.id = "score-box";
      this.uiElement.style.padding = "8px 14px";
      this.uiElement.style.minWidth = "160px";
      this.uiElement.innerHTML = `
        <div style="font-size: 9px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.8px;">Placar de Combate</div>
        <div style="font-size: 16px; font-weight: 900; color: #1a1a1a; margin-top: 1px;">
          Inimigos derrotados: <span id="ui-score-val" style="color: #e06187;">0</span>
        </div>
      `;
    } else if (this.type === "player") {
      this.uiElement.id = "life-box";
      this.uiElement.style.padding = "8px 14px";
      this.uiElement.style.minWidth = "160px";
      this.uiElement.innerHTML = `
        <div style="font-size: 6px; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.8px;">Status do Piloto</div>
        <div style="font-size: 12px; font-weight: 900; color: #1a1a1a; margin-bottom: 4px; display: flex; justify-content: space-between;">
          <span>Vida do Avião</span> <span id="ui-life-val">100%</span>
        </div>
        <div style="width: 100%; height: 7px; background: #e0e0e0; border: 1.5px solid #1a1a1a; border-radius: 4px; overflow: hidden;">
          <div id="ui-life-bar-inner" style="width: 100%; height: 100%; background: linear-gradient(90deg, #ff69b4, #e06187); transition: width 0.3s ease;"></div>
        </div>
      `;
    }

    container.appendChild(this.uiElement);

    if (this.type === "player") {
      this.lifeBarInner = this.uiElement.querySelector("#ui-life-bar-inner");
    }
  }

  /**
   * Executa a lógica de colisão e atualiza os contadores internos e visuais
   * @private
   */
  _registerHit(target) {
    if (this.type === "enemy") {
      this.score += 1;

      const scoreVal = this.uiElement.querySelector("#ui-score-val");
      if (scoreVal) {
        scoreVal.innerText = this.score;
      }

      // Ocultação e desativação segura baseada no objeto estruturado do pool
      if (target) {
        target.ativo = false;
        target.vida = 0; // Sinaliza diretamente para a main.js reciclar
        target.life = 0;
        if (target.mesh) target.mesh.visible = false;
      }
    }

    if (this.type === "player") {
      this.life -= 20;
      if (this.life < 0) this.life = 0;

      // CORREÇÃO DE REFATORAÇÃO DA BARRINHA DE VIDA DO JOGADOR
      const lifeVal = this.uiElement.querySelector("#ui-life-val");
      if (lifeVal) lifeVal.innerText = `${this.life}%`;
      if (this.lifeBarInner) this.lifeBarInner.style.width = `${this.life}%`;
    }

    if (this.onCollisionCallback) {
      this.onCollisionCallback(target, { score: this.score, life: this.life });
    }
  }

  /**
   * CORREÇÃO: Varre os dados estruturados reais do Object Pool dos Inimigos
   */
  checkLaserAgainstTargets(activeLasers, targetList, laserPoolInstance) {
    for (let i = activeLasers.length - 1; i >= 0; i--) {
      let laser = activeLasers[i];

      for (let j = 0; j < targetList.length; j++) {
        let target = targetList[j];

        // Agora sim! Lemos as propriedades diretas do objeto do Pool
        if (target && target.ativo && target.mesh && target.bb) {
          if (laser.bb.intersectsBox(target.bb)) {
            this._registerHit(target);
            laserPoolInstance.despawn(laser, i); // Recicla o tiro rosa Hello Kitty
            break;
          }
        }
      }
    }
  }

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
