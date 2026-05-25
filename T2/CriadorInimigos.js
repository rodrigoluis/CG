import * as THREE from "three";
import { carregarAviaoInimigo } from "./alienVerde.js";
import { carregarAviaoInimigo2 } from "./oviniInimigo.js";
import { CONFIG } from "./Configuracao.js";

export class CriadorInimigos {
  constructor(scene) {
    this.scene = scene;
    this.tempoInimigo = 0;
    this.velocidadePerseguicao = CONFIG.inimigos.velocidadePerseguicao;
    this.velocidadeZigueZague = CONFIG.inimigos.velocidadeZigueZague;
  }

  async criarInimigoAleatorio(x, y, z) {
    const tipoInimigo = Math.random() < 0.5 ? "alien" : "ovni";
    let aviaoMesh;

    if (tipoInimigo === "alien") {
      aviaoMesh = await carregarAviaoInimigo();
    } else {
      aviaoMesh = await carregarAviaoInimigo2();
    }

    aviaoMesh.position.set(x, y, z);
    aviaoMesh.visible = false;

    this.scene.add(aviaoMesh);

    return {
      mesh: aviaoMesh,
      bb: new THREE.Box3().setFromObject(aviaoMesh),
      ativo: false,
      caindo: false,
      velocidadeQuedaY: 0,
      velocidadeGiro: 0,
      tipo: tipoInimigo,
      cantoOriginalX: x,
      posicaoZOriginal: z,
      offsetZAtual: z,
    };
  }

  atualizarMovimento(scaledDelta, aviaoMesh, camera, listaInimigos) {
    if (!aviaoMesh || !listaInimigos) return;

    this.tempoInimigo += scaledDelta;
    const fovRadianos = (camera.fov * Math.PI) / 180;

    let inimigosAtivos = listaInimigos.filter(
      (inimigo) => inimigo.ativo && !inimigo.caindo,
    );
    let ativosNaTela = inimigosAtivos.length;
    inimigosAtivos.sort((a, b) => a.indice - b.indice);

    listaInimigos.forEach((inimigoTarget) => {
      if (!inimigoTarget.ativo) return;

      const inimigo = inimigoTarget.mesh;
      if (!inimigo) return;

      inimigo.visible = true;

      if (inimigoTarget.caindo) {
        const forcaGravidade = CONFIG.inimigos.gravidadeQueda || 280;
        inimigoTarget.velocidadeQuedaY += scaledDelta * forcaGravidade;
        inimigo.position.y -= inimigoTarget.velocidadeQuedaY * scaledDelta;

        inimigo.rotation.x += inimigoTarget.velocidadeGiro * 2 * scaledDelta;
        inimigo.rotation.z += inimigoTarget.velocidadeGiro * 2.5 * scaledDelta;

        inimigo.position.z = aviaoMesh.position.z + inimigoTarget.offsetZAtual;

        inimigoTarget.bb.makeEmpty();
        return;
      }

      const i = inimigoTarget.indice;
      const ordem = inimigosAtivos.indexOf(inimigoTarget);

      inimigoTarget.offsetZAtual = THREE.MathUtils.lerp(
        inimigoTarget.offsetZAtual,
        inimigoTarget.posicaoZOriginal,
        scaledDelta * 1.5,
      );
      inimigo.position.z = aviaoMesh.position.z + inimigoTarget.offsetZAtual;

      const distanciaFixaCamera = 150 + inimigoTarget.offsetZAtual;
      const metadeAlturaVisivel =
        Math.tan(fovRadianos / 2) * distanciaFixaCamera;
      const limiteBordaMonitorX = metadeAlturaVisivel * camera.aspect;

      const distanciaSegurancaBorda = 8;
      const amplitudeX = Math.max(
        10,
        limiteBordaMonitorX - distanciaSegurancaBorda,
      );

      const direcaoSinal = i % 2 === 0 ? 1 : -1;
      const variacaoVelocidade = this.velocidadeZigueZague * (1 + i * 0.05);

      let destinoX =
        direcaoSinal *
        Math.sin(this.tempoInimigo * variacaoVelocidade) *
        amplitudeX;

      let posXAnterior = inimigo.position.x;
      inimigo.position.x = THREE.MathUtils.lerp(
        inimigo.position.x,
        destinoX,
        scaledDelta * this.velocidadePerseguicao,
      );

      const centroTelaY = CONFIG.input.planeBaseY;
      const novaDistanciaY = 24;

      let offsetY = 0;
      if (ativosNaTela > 1 && ordem !== -1) {
        offsetY = (ordem === 0 ? -0.5 : 0.5) * novaDistanciaY;
      }

      const flutuacaoOrganica = Math.sin(this.tempoInimigo * 2 + i) * 1.5;
      const destinoY = centroTelaY + offsetY + flutuacaoOrganica;

      // Proteção contra delta de pausa travando a nave em Y flutuante fora de órbita
      inimigo.position.y = THREE.MathUtils.lerp(
        inimigo.position.y,
        destinoY,
        scaledDelta * this.velocidadePerseguicao,
      );

      let velocidadexReal =
        (inimigo.position.x - posXAnterior) / (scaledDelta || 0.016);
      inimigo.rotation.z = THREE.MathUtils.lerp(
        inimigo.rotation.z,
        -velocidadexReal * 0.002,
        scaledDelta * 5,
      );

      inimigoTarget.bb.setFromObject(inimigo);
    });

    if (ativosNaTela < 2) {
      const reservas = listaInimigos.filter((inimigo) => !inimigo.ativo);

      if (reservas.length > 0) {
        const proximoReserva =
          reservas[Math.floor(Math.random() * reservas.length)];

        if (proximoReserva?.mesh) {
          const distanciaSpawnZ = 950;
          const borderSpawnX =
            Math.tan(fovRadianos / 2) * distanciaSpawnZ * camera.aspect;
          const bordaNascimentoX =
            Math.random() < 0.5 ? -borderSpawnX * 0.85 : borderSpawnX * 0.85;

          proximoReserva.posicaoZOriginal = CONFIG.inimigos.posicaoZCombate;
          proximoReserva.offsetZAtual = CONFIG.inimigos.distanciaSpawnZ;

          proximoReserva.caindo = false;
          proximoReserva.velocidadeQuedaY = 0;
          proximoReserva.velocidadeGiro = 0;
          proximoReserva.mesh.rotation.set(0, 0, 0);

          proximoReserva.mesh.position.set(
            bordaNascimentoX,
            CONFIG.input.planeBaseY,
            aviaoMesh.position.z + CONFIG.inimigos.distanciaSpawnZ,
          );

          proximoReserva.cantoOriginalX = bordaNascimentoX;
          proximoReserva.bb.setFromObject(proximoReserva.mesh);

          proximoReserva.ativo = true;
          proximoReserva.mesh.visible = true;
        }
      }
    }
  }
}
