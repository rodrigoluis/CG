import * as THREE from "three";
// === 1. ADICIONA A IMPORTAÇÃO DO CONFIG NO TOPO ===
import { CONFIG } from "./Configuracao.js";

export class LaserPool {
  /**
   * @param {THREE.Scene} scene - A cena principal do jogo.
   * @param {string} tipoAtirador - Identifica quem usa este pool: "player" ou "enemy".
   * @param {string} corRGB - Cor do laser em formato de string (ex: "rgb(255, 105, 180)")
   * @param {number} poolSize - Quantidade máxima de tiros alocados.
   */
  constructor(
    scene,
    tipoAtirador = "player",
    corRGB = "#e06187",
    poolSize = 30,
  ) {
    this.scene = scene;
    this.tipoAtirador = tipoAtirador; // "player" ou "enemy"
    this.poolSize = poolSize;

    this.pool = [];
    this.activeLasers = [];

    // === GEOMETRIA ANATOMICA MUITO MAIS CHAMATIVA ===
    this.geometry = new THREE.BoxGeometry(0.3, 0.3, 2.0, 6);

    // === MATERIAL ESTILO NEON BRILHANTE (IMUNE À NÉVOA) ===
    this.material = new THREE.MeshStandardMaterial({
      color: corRGB,
      emissive: corRGB,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0.95,
      fog: true,
    });

    this.initPool();
  }

  /**
   * Preenche a memória inicialmente com tiros desativados
   */
  initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      let mesh = new THREE.Mesh(this.geometry, this.material);
      mesh.visible = false;

      let laserData = {
        mesh: mesh,
        bb: new THREE.Box3(),
        active: false,
        startPosition: new THREE.Vector3(),
      };

      this.pool.push(laserData);
      this.scene.add(mesh);
    }
  }

  /**
   * Ativa um tiro do pool a partir de uma posição e rotação de disparo
   */
  shoot(spawnPosition, direcaoOuRotacao) {
    let laser = this.pool.find((l) => !l.active);

    if (laser) {
      laser.mesh.position.copy(spawnPosition);
      laser.startPosition.copy(spawnPosition);

      // Se for um Vetor (direção do tiro do inimigo ou do jogador com retícula)
      if (direcaoOuRotacao instanceof THREE.Vector3) {
        let alvoLook = new THREE.Vector3().addVectors(
          spawnPosition,
          direcaoOuRotacao,
        );
        laser.mesh.lookAt(alvoLook);
        laser.direcaoCustomizada = direcaoOuRotacao.clone().normalize();
      } else {
        // Se for Euler (rotação padrão do jogador)
        laser.mesh.rotation.copy(direcaoOuRotacao);
        laser.direcaoCustomizada = null;
      }

      laser.mesh.visible = true;
      laser.active = true;
      laser.bb.setFromObject(laser.mesh);
      this.activeLasers.push(laser);
    }
  }

  /**
   * Atualiza e move os lasers ativos com base na classe central CONFIG
   * @param {number} scaledDelta - Delta do clock multiplicado pelo gameSpeed
   * @param {number|null} fogFar - Limite de corte da névoa da cena
   */
  update(scaledDelta, fogFar = null) {
    for (let i = this.activeLasers.length - 1; i >= 0; i--) {
      let laser = this.activeLasers[i];

      // --- 2. SISTEMA DE MOVIMENTAÇÃO ADAPTADO AO CONFIG ---
      if (laser.direcaoCustomizada) {
        // INIMIGO (ou Jogador com mira em Vector3): usa a velocidade configurada multiplicada por um fator base de física
        const velocidadeInimigoBase = CONFIG.lasers.velocidadeInimigo * 75;
        laser.mesh.position.addScaledVector(
          laser.direcaoCustomizada,
          velocidadeInimigoBase * scaledDelta,
        );
      } else {
        // JOGADOR (Em modo de rotação local Euler): usa a velocidade do jogador configurada
        const velocidadeJogadorBase = CONFIG.lasers.velocidadeJogador * 75;
        laser.mesh.translateZ(velocidadeJogadorBase * scaledDelta);
      }

      // Atualiza a Bounding Box de colisão acompanhando a nova posição
      laser.bb.setFromObject(laser.mesh);

      // --- 3. CHECK DE SEGURANÇA: SUMIÇO PERTO DA TELA ---
      // Se o tiro passar raspando e cruzar para trás do limite perto da tela, desativa na hora
      if (laser.mesh.position.z < CONFIG.lasers.distanciaSumiçoPerto) {
        this.despawn(laser, i);
        continue; // Pula para o próximo loop
      }

      // --- SISTEMA LOGÍSTICO DE DESCARTE POR DISTÂNCIA ---
      let distanciaPercorrida = laser.mesh.position.distanceTo(
        laser.startPosition,
      );

      if (this.tipoAtirador === "player") {
        // APENAS O JOGADOR: Usa o fog collector da névoa
        if (fogFar && distanciaPercorrida > fogFar) {
          this.despawn(laser, i);
        }
      } else {
        // INIMIGOS: Usam o limite máximo estipulado no horizonte
        if (distanciaPercorrida > 350) {
          this.despawn(laser, i);
        }
      }
    }
  }

  /**
   * Esconde o tiro e devolve-o à reserva do pool
   */
  despawn(laser, index) {
    laser.active = false;
    laser.mesh.visible = false;
    this.activeLasers.splice(index, 1);
  }

  /**
   * Retorna os lasers ativos para o CollisionManager
   */
  getActiveLasers() {
    return this.activeLasers;
  }
}
