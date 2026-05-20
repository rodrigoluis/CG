import * as THREE from "three";

export class LaserPool {
  constructor(scene, poolSize = 20) {
    this.scene = scene;
    this.poolSize = poolSize;

    this.pool = [];
    this.activeLasers = [];

    this.geometry = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
    this.geometry.rotateX(Math.PI / 2);
    this.geometry.rotateY(Math.PI);

    this.material = new THREE.MeshBasicMaterial({
      color: "rgb(181, 28, 104)", // Rosa choque (Hot Pink) bem no estilo Hello Kitty!
      transparent: true,
      opacity: 0.9, // Deixa um leve efeito de brilho/laser
    });
    this.initPool();
  }

  // Inicializa o pool com objetos "desativados"
  initPool() {
    for (let i = 0; i < this.poolSize; i++) {
      let mesh = new THREE.Mesh(this.geometry, this.material);
      mesh.visible = false; // Desativado por padrão

      let laserData = {
        mesh: mesh,
        bb: new THREE.Box3(),
        active: false,
        speed: 0.2,
      };

      this.pool.push(laserData);
      this.scene.add(mesh); // Adicionado à cena uma única vez
    }
  }

  // Ativa um tiro do pool (Equivalente ao "Instantiate" ou New)
  shoot(spawnPosition, aircraftRotation) {
    let laser = this.pool.find((l) => !l.active);
    if (laser) {
      laser.mesh.position.copy(spawnPosition);
      laser.mesh.rotation.copy(aircraftRotation);

      // Guarda a posição exata de onde o tiro nasceu
      if (!laser.startPosition) {
        laser.startPosition = new THREE.Vector3();
      }
      laser.startPosition.copy(spawnPosition);

      laser.mesh.visible = true;
      laser.active = true;
      laser.bb.setFromObject(laser.mesh);
      this.activeLasers.push(laser);
    }
  }

  update(scaledDelta, fogFar) {
    for (let i = this.activeLasers.length - 1; i >= 0; i--) {
      let laser = this.activeLasers[i];

      // Move o tiro para a frente
      laser.mesh.translateZ(-300 * scaledDelta);

      // Atualiza a Bounding Box de colisão
      laser.bb.setFromObject(laser.mesh);

      // CALCULO SEGURO DE DESCARTE:
      // Mede a distância real entre a posição atual do tiro e onde ele nasceu
      let distanciaPercorrida = laser.mesh.position.distanceTo(
        laser.startPosition,
      );

      // Se o tiro viajou mais do que a distância da névoa, ele some!
      if (distanciaPercorrida > fogFar) {
        this.despawn(laser, i);
      }
    }
  }

  // Desativa o tiro e devolve ao pool (Evita chamar o Garbage Collector)
  despawn(laser, index) {
    laser.active = false;
    laser.mesh.visible = false;
    this.activeLasers.splice(index, 1);
  }

  // Atualiza a posição dos tiros e suas Bounding Boxes
  update() {
    for (let i = this.activeLasers.length - 1; i >= 0; i--) {
      let laser = this.activeLasers[i];

      // No estilo Star Fox, o tiro vai para frente (eixo -Z ou conforme seu cenário)
      // Ajuste o sinal do speed de acordo com a direção do seu jogo
      laser.mesh.translateZ(-laser.speed);

      // Atualiza a Bounding Box do laser para acompanhar o movimento
      laser.bb.setFromObject(laser.mesh);

      // Limite de alcance: Se o tiro se afastar demais, ele é reciclado
      if (laser.mesh.position.z < -50 || laser.mesh.position.z > 50) {
        this.despawn(laser, i);
      }
    }
  }

  // Retorna a lista de tiros ativos para checagem de colisão na main
  getActiveLasers() {
    return this.activeLasers;
  }
}
