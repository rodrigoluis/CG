import * as THREE from "three";

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

    // === 1. GEOMETRIA ANATOMICA MUITO MAIS CHAMATIVA ===
    // Engordamos o raio de 0.15 para 0.65 e esticamos o comprimento de 2.5 para 8.5
    // Isso cria um feixe robusto que corta o cenário de forma nítida e imponente!
    this.geometry = new THREE.BoxGeometry(0.25, 0.25, 2.0, 6);

    // === 2. MATERIAL ESTILO NEON BRILHANTE (IMUNE À NÉVOA) ===
    // Mudamos para MeshStandardMaterial para habilitar a emissão de cor (brilho próprio no escuro)
    this.material = new THREE.MeshStandardMaterial({
      color: corRGB,
      emissive: corRGB, // Faz o laser brilhar com luz própria (efeito sabre de luz)
      emissiveIntensity: 2.5, // Intensidade forte para destacar no céu azul
      transparent: true,
      opacity: 0.95,
      fog: false, // O TRUQUE DE OURO: Impede que a névoa da main.js apague ou desbote o laser
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
        startPosition: new THREE.Vector3(), // Guarda onde o tiro nasceu
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

      // Se for um Vetor (direção do tiro do inimigo)
      if (direcaoOuRotacao instanceof THREE.Vector3) {
        // Faz o laser olhar diretamente para a direção do alvo
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
   * Atualiza e move os lasers ativos, aplicando o descarte por névoa APENAS para o jogador
   * @param {number} scaledDelta - Delta do clock multiplicado pelo gameSpeed
   * @param {number|null} fogFar - Limite de corte da névoa da cena (opcional para inimigos)
   */
  update(scaledDelta, fogFar = null) {
    for (let i = this.activeLasers.length - 1; i >= 0; i--) {
      let laser = this.activeLasers[i];

      // --- SISTEMA DE MOVIMENTAÇÃO ISOLADO ---
      if (laser.direcaoCustomizada) {
        // INIMIGO: Se tem direção customizada (Vetor), move baseado nele (Velocidade 150)
        laser.mesh.position.addScaledVector(
          laser.direcaoCustomizada,
          150 * scaledDelta,
        );
      } else {
        // JOGADOR: Se não tem, usa o translateZ local padrão para frente (+300)
        laser.mesh.translateZ(300 * scaledDelta);
      }

      // Atualiza a Bounding Box de colisão acompanhando a nova posição
      laser.bb.setFromObject(laser.mesh);

      // --- SISTEMA LOGÍSTICO DE DESCARTE ---
      let distanciaPercorrida = laser.mesh.position.distanceTo(
        laser.startPosition,
      );

      if (this.tipoAtirador === "player") {
        // APENAS O JOGADOR: Usa o fog collector da névoa
        if (fogFar && distanciaPercorrida > fogFar) {
          this.despawn(laser, i);
        }
      } else {
        // INIMIGOS: Usam um descarte fixo por distância para não sumirem no meio da tela
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
