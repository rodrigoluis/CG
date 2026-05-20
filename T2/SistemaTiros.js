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
  shoot(spawnPosition, rotation) {
    let laser = this.pool.find((l) => !l.active);

    if (laser) {
      laser.mesh.position.copy(spawnPosition);
      laser.mesh.rotation.copy(rotation);
      laser.startPosition.copy(spawnPosition); // Registra a origem do disparo

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

      // CORREÇÃO DE SINAL: Invertido para o jogador ir para frente e inimigo para trás
      const direcaoVelocidade = this.tipoAtirador === "player" ? 300 : -300;
      laser.mesh.translateZ(direcaoVelocidade * scaledDelta);

      // Atualiza a Bounding Box de colisão
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
        // INIMIGOS: Usam um descarte fixo por distância
        if (distanciaPercorrida > 250) {
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
