import * as THREE from "three";
import { carregarAviaoInimigo } from "./alienVerde.js";
import { carregarAviaoInimigo2 } from "./oviniInimigo.js";

export class CriadorInimigos {
  constructor(scene) {
    this.scene = scene;

    // Armazena o tempo interno de oscilação e os parâmetros de controle
    this.tempoInimigo = 0;
    this.velocidadePerseguicao = 2.0;
    this.velocidadeZigueZague = 1.4;
  }

  /**
   * Instancia um inimigo aleatório na cena
   */
  async criarInimigoAleatorio(x, y, z) {
    const tipoInimigo = Math.random() < 0.5 ? "alien" : "ovni";
    let aviaoMesh;

    if (tipoInimigo === "alien") {
      aviaoMesh = await carregarAviaoInimigo();
      aviaoMesh.scale.set(10, 10, 10);
    } else {
      aviaoMesh = await carregarAviaoInimigo2();
    }

    aviaoMesh.position.set(x, y, z);
    this.scene.add(aviaoMesh);

    return {
      mesh: aviaoMesh,
      bb: new THREE.Box3().setFromObject(aviaoMesh),
      ativo: true,
      tipo: tipoInimigo,
    };
  }

  /**
   * GERENCIADOR UNIFICADO DE MOVIMENTAÇÃO
   * Processa o zigue-zague, lerp, limites de borda e inclinação (inércia)
   */
  atualizarMovimento(
    scaledDelta,
    aviaoMesh,
    camera,
    inimigoTarget1,
    inimigoTarget2,
  ) {
    if (!aviaoMesh) return;

    // Incrementa o tempo interno da classe
    this.tempoInimigo += scaledDelta;
    const fovRadianos = (camera.fov * Math.PI) / 180;

    // --- Movimentação do Inimigo 1 ---
    if (inimigoTarget1 && inimigoTarget1.ativo && inimigoTarget1.mesh) {
      const inimigo = inimigoTarget1.mesh;
      const distanciaZ1 = Math.abs(
        camera.position.z - (aviaoMesh.position.z + 90),
      );
      const alturaVisivel1 = 3 * Math.tan(fovRadianos / 2) * distanciaZ1;
      const limiteBordaX1 = ((alturaVisivel1 * camera.aspect) / 1.5) * 0.85;

      let desvioX =
        Math.sin(this.tempoInimigo * this.velocidadeZigueZague) *
        (limiteBordaX1 * 0.4);
      let destinoX = THREE.MathUtils.clamp(
        aviaoMesh.position.x + desvioX,
        -limiteBordaX1,
        limiteBordaX1,
      );

      let posXAnterior = inimigo.position.x;

      inimigo.position.x = THREE.MathUtils.lerp(
        inimigo.position.x,
        destinoX,
        scaledDelta * this.velocidadePerseguicao,
      );
      inimigo.position.y = THREE.MathUtils.lerp(
        inimigo.position.y,
        aviaoMesh.position.y - 5,
        scaledDelta * this.velocidadePerseguicao,
      );
      inimigo.position.z = aviaoMesh.position.z + 90;

      let velocidadeXReal = (inimigo.position.x - posXAnterior) / scaledDelta;
      inimigo.rotation.z = THREE.MathUtils.lerp(
        inimigo.rotation.z,
        -velocidadeXReal * 0.01,
        scaledDelta * 5,
      );

      inimigoTarget1.bb.setFromObject(inimigo);
    }

    // --- Movimentação do Inimigo 2 ---
    if (inimigoTarget2 && inimigoTarget2.ativo && inimigoTarget2.mesh) {
      const inimigo2 = inimigoTarget2.mesh;
      const distanciaZ2 = Math.abs(
        camera.position.z - (aviaoMesh.position.z + 130),
      );
      const alturaVisivel2 = 4.5 * Math.tan(fovRadianos / 2) * distanciaZ2;
      const limiteBordaX2 = ((alturaVisivel2 * camera.aspect) / 1.5) * 0.85;

      let desvioX =
        -Math.sin(this.tempoInimigo * 1.3 * this.velocidadeZigueZague) *
        (limiteBordaX2 * 0.4);
      let destinoX = THREE.MathUtils.clamp(
        aviaoMesh.position.x + desvioX,
        -limiteBordaX2,
        limiteBordaX2,
      );

      let posXAnterior = inimigo2.position.x;

      inimigo2.position.x = THREE.MathUtils.lerp(
        inimigo2.position.x,
        destinoX,
        scaledDelta * (this.velocidadePerseguicao * 0.8),
      );
      inimigo2.position.y = THREE.MathUtils.lerp(
        inimigo2.position.y,
        aviaoMesh.position.y + 20,
        scaledDelta * (this.velocidadePerseguicao * 0.8),
      );
      inimigo2.position.z = aviaoMesh.position.z + 130;

      let velocidadeXReal = (inimigo2.position.x - posXAnterior) / scaledDelta;
      inimigo2.rotation.z = THREE.MathUtils.lerp(
        inimigo2.rotation.z,
        -velocidadeXReal * 0.01,
        scaledDelta * 5,
      );

      inimigoTarget2.bb.setFromObject(inimigo2);
    }
  }
}
