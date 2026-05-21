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
   * Instancia um inimigo desativado no pool
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
    aviaoMesh.visible = false;

    this.scene.add(aviaoMesh);

    return {
      mesh: aviaoMesh,
      bb: new THREE.Box3().setFromObject(aviaoMesh),
      ativo: false,
      caindo: false, // Nova propriedade para controlar a animação de morte
      velocidadeQuedaY: 0,
      velocidadeGiro: 0,
      tipo: tipoInimigo,
      cantoOriginalX: x,
      posicaoZOriginal: z,
      offsetZAtual: z,
    };
  }

  /**
   * GERENCIADOR DE MOVIMENTAÇÃO ADAPTÁVEL COM FORMAÇÃO SIMÉTRICA OTIMIZADA
   */
  atualizarMovimento(scaledDelta, aviaoMesh, camera, listaInimigos) {
    if (!aviaoMesh || !listaInimigos) return;

    this.tempoInimigo += scaledDelta;
    const fovRadianos = (camera.fov * Math.PI) / 180;

    // Filtra e ordena apenas os inimigos que estão combatendo normalmente (ativos e não caindo)
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
        // 1. Desce no eixo Y acelerando pela gravidade simulada
        inimigoTarget.velocidadeQuedaY += scaledDelta * 55; // Ajuste de força da queda
        inimigo.position.y -= inimigoTarget.velocidadeQuedaY * scaledDelta;

        // 2. CORREÇÃO: Removemos a atualização dos eixos X e Z!
        // O inimigo agora fica totalmente estático no plano horizontal, caindo reto.

        // 3. Atualiza a Bounding Box vazia para evitar novos registros de colisão no fantasma
        inimigoTarget.bb.makeEmpty();
        return;
      }

      // === COMPORTAMENTO NORMAL DE VOO (SÓ SE NÃO ESTIVER CAINDO) ===
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

      const centroTelaY = 32;
      const novaDistanciaY = 24;

      let offsetY = 0;
      if (ativosNaTela > 1 && ordem !== -1) {
        offsetY = (ordem === 0 ? -0.5 : 0.5) * novaDistanciaY;
      }

      const flutuacaoOrganica = Math.sin(this.tempoInimigo * 2 + i) * 1.5;
      const destinoY = centroTelaY + offsetY + flutuacaoOrganica;

      inimigo.position.y = THREE.MathUtils.lerp(
        inimigo.position.y,
        destinoY,
        scaledDelta * this.velocidadePerseguicao,
      );

      let velocidadexReal = (inimigo.position.x - posXAnterior) / scaledDelta;
      inimigo.rotation.z = THREE.MathUtils.lerp(
        inimigo.rotation.z,
        -velocidadexReal * 0.01,
        scaledDelta * 5,
      );

      inimigoTarget.bb.setFromObject(inimigo);
    });

    // === LOGÍSTICA DE REPOSICIONAMENTO DE RESERVAS (Z+800) ===
    if (ativosNaTela < 2) {
      const reservas = listaInimigos.filter((inimigo) => !inimigo.ativo);

      if (reservas.length > 0) {
        const proximoReserva =
          reservas[Math.floor(Math.random() * reservas.length)];

        if (proximoReserva && proximoReserva.mesh) {
          const distanciaSpawnZ = 950;
          const bordaSpawnX =
            Math.tan(fovRadianos / 2) * distanciaSpawnZ * camera.aspect;
          const bordaNascimentoX =
            Math.random() < 0.5 ? -bordaSpawnX * 0.85 : bordaSpawnX * 0.85;

          proximoReserva.posicaoZOriginal = 140;
          proximoReserva.offsetZAtual = 800;

          // Reseta rotações e estados de queda para o reuso limpo
          proximoReserva.caindo = false;
          proximoReserva.velocidadeQuedaY = 0;
          proximoReserva.velocidadeGiro = 0;
          proximoReserva.mesh.rotation.set(0, 0, 0);

          proximoReserva.mesh.position.set(
            bordaNascimentoX,
            32,
            aviaoMesh.position.z + 800,
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
