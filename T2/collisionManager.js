// CollisionManager.js
import * as THREE from "three";

export class CollisionManager {
  constructor(type, onCollisionCallback = null, uiCallbacks = {}) {
    this.type = type;
    this.onCollisionCallback = onCollisionCallback;
    this.uiCallbacks = uiCallbacks;

    if (globalThis._gameStats === undefined) {
      globalThis._gameStats = { enemy: 0, player: 0 };
    }

    this.score = 0;
    this.life = 0;
  }

  _registerHit(target) {
    if (this.type === "enemy") {
      this.score += 1;
      globalThis._gameStats.enemy = this.score;
      this.uiCallbacks.updateScore?.(this.score);
      if (target) {
        target.vida = 0;
        target.life = 0;
      }
    }

    if (this.type === "player") {
      this.life += 1;
      globalThis._gameStats.player = this.life;
      this.uiCallbacks.updateLife?.(this.life);
    }

    if (this.onCollisionCallback) {
      this.onCollisionCallback(target, { score: this.score, life: this.life });
    }

    this.uiCallbacks.updateSaldo?.(globalThis._gameStats.enemy, globalThis._gameStats.player);
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
