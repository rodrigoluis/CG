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
      posicaoZOriginal: z, // ESSA É A POSIÇÃO ALVO DE COMBATE FINAL (ex: 90, 120, 150)
      offsetZAtual: z, // Controla a transição do Z frame a frame
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

      // === DINÂMICA DE APROXIMAÇÃO SUAVE ===
      // Se o inimigo acabou de nascer em +300, ele vai deslizando suavemente (lerp)
      // em direção à sua posicaoZOriginal de combate (velocidade de aproximação: 1.5)
      inimigoTarget.offsetZAtual = THREE.MathUtils.lerp(
        inimigoTarget.offsetZAtual,
        inimigoTarget.posicaoZOriginal,
        scaledDelta * 1.5,
      );

      const offsetZ = inimigoTarget.offsetZAtual;
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

      // Aplica o offsetZ que está deslizando dinamicamente até o alvo original
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
    if (ativosNaTela < 2) {
      const proximoReserva = listaInimigos.find((inimigo) => !inimigo.ativo);
      if (proximoReserva && proximoReserva.mesh) {
        const novoCantoX = Math.random() < 0.5 ? -80 : 80;

        // SURGIMENTO NO HORIZONTE: Nasce exatamente onde você gostou (+300 na frente do avião)
        const novaPosicaoZ = aviaoMesh.position.z + 800;
        proximoReserva.mesh.position.set(novoCantoX, 25, novaPosicaoZ);

        // CONFIGURAÇÃO INICIAL: Dizemos que o offset ATUAL dele é 300 (longe)
        // O loop lá em cima vai se encarregar de puxar esse valor de volta até o original!
        proximoReserva.offsetZAtual = 300;
        proximoReserva.cantoOriginalX = novoCantoX;

        // Ativa a nave
        proximoReserva.ativo = true;
        proximoReserva.mesh.visible = true;

        console.log(
          `[POOL] Inimigo ${proximoReserva.indice} surgindo na névoa em Z+300. Viajando para o Z original: ${proximoReserva.posicaoZOriginal}`,
        );
      }
    }
  }
}
