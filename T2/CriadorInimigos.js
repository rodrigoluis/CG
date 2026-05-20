import * as THREE from "three";
import { carregarAviaoInimigo } from "./alienVerde.js";
import { carregarAviaoInimigo2 } from "./oviniInimigo.js";

export class CriadorInimigos {
  constructor(scene) {
    this.scene = scene;
    this.tempoInimigo = 0;
    this.velocidadePerseguicao = 2.0;
    this.velocidadeZigueZague = 1.4;
  }

  /**
   * Instancia um inimigo desativado no pool (Garbage Collector Friendly)
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
    aviaoMesh.visible = false; // Começa invisível/escondido no pool

    this.scene.add(aviaoMesh);

    return {
      mesh: aviaoMesh,
      bb: new THREE.Box3().setFromObject(aviaoMesh),
      ativo: false, // Começa desativado esperando a sua vez de entrar na tela
      tipo: tipoInimigo,
      cantoOriginalX: x, // Guarda de qual canto ele deve surgir quando for ativado
      posicaoZOriginal: z,
    };
  }

  /**
   * GERENCIADOR DE MOVIMENTAÇÃO DO POOL ATIVO
   */
  atualizarMovimento(scaledDelta, aviaoMesh, camera, listaInimigos) {
    if (!aviaoMesh || !listaInimigos) return;

    this.tempoInimigo += scaledDelta;
    const fovRadianos = (camera.fov * Math.PI) / 180;

    // Controla quantos inimigos estão ativos atualmente na tela
    let ativosNaTela = 0;

    listaInimigos.forEach((inimigoTarget) => {
      // Se o inimigo não está ativo, ignoramos a movimentação dele
      if (!inimigoTarget.ativo) {
        if (inimigoTarget.mesh) inimigoTarget.mesh.visible = false;
        return;
      }

      ativosNaTela++;
      const inimigo = inimigoTarget.mesh;
      inimigo.visible = true; // Garante que está visível

      const i = inimigoTarget.indice;
      const offsetZ = inimigoTarget.posicaoZOriginal;
      const distanciaZ = Math.abs(
        camera.position.z - (aviaoMesh.position.z + offsetZ),
      );

      const multiplicadorAltura = i % 2 === 0 ? 3 : 4.5;
      const offsetY = i % 2 === 0 ? -5 : 15 + i * 2;

      const alturaVisivel =
        multiplicadorAltura * Math.tan(fovRadianos / 2) * distanciaZ;
      const limiteBordaX = ((alturaVisivel * camera.aspect) / 1.5) * 0.85;

      const direcaoSinal = i % 2 === 0 ? 1 : -1;
      const variacaoVelocidade = this.velocidadeZigueZague * (1 + i * 0.05);

      let desvioX =
        direcaoSinal *
        Math.sin(this.tempoInimigo * variacaoVelocidade) *
        (limiteBordaX * 0.4);
      let destinoX = THREE.MathUtils.clamp(
        aviaoMesh.position.x + desvioX,
        -limiteBordaX,
        limiteBordaX,
      );

      let posXAnterior = inimigo.position.x;

      inimigo.position.x = THREE.MathUtils.lerp(
        inimigo.position.x,
        destinoX,
        scaledDelta * this.velocidadePerseguicao,
      );
      inimigo.position.y = THREE.MathUtils.lerp(
        inimigo.position.y,
        aviaoMesh.position.y + offsetY,
        scaledDelta * (this.velocidadePerseguicao * 0.8),
      );
      inimigo.position.z = aviaoMesh.position.z + offsetZ;

      let velocidadexReal = (inimigo.position.x - posXAnterior) / scaledDelta;
      inimigo.rotation.z = THREE.MathUtils.lerp(
        inimigo.rotation.z,
        -velocidadexReal * 0.01,
        scaledDelta * 5,
      );

      inimigoTarget.bb.setFromObject(inimigo);
    });

    // SISTEMA LOGÍSTICO DE OBJECT POOLING:
    // Se houver menos de 2 inimigos na tela, ativamos o próximo da reserva!
    if (ativosNaTela < 2) {
      const proximoReserva = listaInimigos.find((inimigo) => !inimigo.ativo);
      if (proximoReserva && proximoReserva.mesh) {
        // Reinicia a posição dele para o canto do ecrã antes de entrar deslizando
        proximoReserva.mesh.position.set(
          proximoReserva.cantoOriginalX,
          25,
          proximoReserva.posicaoZOriginal,
        );
        proximoReserva.ativo = true;
        proximoReserva.mesh.visible = true;
      }
    }
  }
}
