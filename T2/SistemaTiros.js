import * as THREE from "three";

export class LaserPool {
  /**
   * @param {THREE.Scene} scene - A cena principal do jogo.
   * @param {string} tipoAtirador - Identifica quem usa este pool: "player" ou "enemy".
   * @param {string} corRGB - Cor do laser em formato de string (ex: "rgb(255, 105, 180)")
   * @param {number} poolSize - Quantidade máxima de tiros alocados.
   * @param {THREE.Vector3} spawnPosition - Onde o tiro nasce
   * @param {THREE.Euler|THREE.Vector3} direcaoOuRotacao
   */
  constructor(
    scene,
    tipoAtirador = "player",
    corRGB = "rgb(255, 105, 180)",
    poolSize = 30,
  ) {
    this.scene = scene;
    this.tipoAtirador = tipoAtirador; // "player" ou "enemy"
    this.poolSize = poolSize;

    this.pool = [];
    this.activeLasers = [];

    // Geometria padrão para os lasers do jogo (Cilindro linear alongado)
    this.geometry = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
    this.geometry.rotateX(Math.PI / 2);

    // Material customizável pela cor passada no construtor
    this.material = new THREE.MeshBasicMaterial({
      color: corRGB,
      transparent: true,
      opacity: 0.95,
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
