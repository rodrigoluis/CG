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
      if (!laser?.active) continue;

      for (const element of targets) {
        let target = element;
        if (!target) continue;

        // === AJUSTE DE RESOLUÇÃO DE ARQUITETURA ===
        const descobreMesh = target.mesh ? target.mesh : target;
        const boundingBox = this.getBoundingBox(target);

        const estaAtivo = target.ativo === undefined ? true : target.ativo;
        const estaCaindo = target.caindo === undefined ? false : target.caindo;

        // Se o alvo não estiver pronto para combate, ignora
        if (!estaAtivo || estaCaindo) continue;

        // Executa o teste de interseção física das Bounding Boxes
        if (laser.bb && boundingBox && laser.bb.intersectsBox(boundingBox)) {
          // === REGRA DO FOG BLINDADA ===
          if (camera && scene?.fog && descobreMesh) {
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
            if (target.life !== undefined) target.life -= 50;
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

  getBoundingBox(target) {
    if (target.bb) {
      return target.bb;
    }
    if (target.geometry) {
      return target.geometry;
    }
    let obj = new THREE.Box3().setFromObject(target)
    if (obj) {
      return obj;
    }
    return null;
  }

}
