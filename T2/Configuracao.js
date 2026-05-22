/**
 * @file Configuracao.js
 * Centraliza os parâmetros de balanceamento, design, física, câmera e cenário do jogo.
 */

export const CONFIG = {
  // === CONFIGURAÇÕES DOS INIMIGOS ===
  inimigos: {
    velocidadePerseguicao: 2.0,
    velocidadeZigueZague: 1.4,
    intervaloTiro: 1,
    delayPrimeiroTiro: -1.5,
    posicaoZCombate: 140,
    distanciaSpawnZ: 800,
    gravidadeQueda: 280.0,
  },

  // === CONFIGURAÇÕES DO SISTEMA DE LASERS ===
  lasers: {
    velocidadeJogador: 4.0,
    velocidadeInimigo: 2.0,
    cadenciaJogador: 0.1,
    distanciaSumiçoPerto: -140,
  },

  // === CONFIGURAÇÕES DO INPUT / CONTROLES ===
  input: {
    smoothFactorXY: 4.5, // Amortecimento elástico da nave seguindo a mira
    planeBaseY: 105, // Sincronizado com o seu novo valor (105) para manter o avião alto no céu
    boundsX: 65, // Trava de limite horizontal do mouse
    boundsY: 25, // Trava de limite vertical do mouse
  },

  // === CONFIGURAÇÕES DA CÂMERA ===
  camera: {
    offsetZ: -95, // Distância que a câmera fica presa atrás do avião
    offsetY: 0, // Altura extra da câmera em relação ao avião
    lookAhead: 200, // Distância à frente em que a câmera foca o olhar
    rollFactor: 0.005, // Intensidade da inclinação do horizonte nas curvas
    xyTimeConstant: 1, // Tempo de resposta elástica do balanço lateral da câmera
    multiplicadorBalançoX: 0.07, // Sensibilidade de acompanhamento da câmera no eixo X
    multiplicadorBalançoY: 0.07, // Sensibilidade de acompanhamento da câmera no eixo Y
  },

  // === CONFIGURAÇÕES DOS TILES DE CENÁRIO E ÁRVORES ===
  cenario: {
    tiles: {
      tamanho: 2000, // Comprimento tridimensional absoluto de cada quarteirão (Z)
      segmentos: 63, // Resolução geométrica da malha do relevo
      velocidadeRolagem: 50, // Velocidade com que o chão se move para trás
      alturaMaxima: 100, // Pico mais alto das montanhas procedurais
      alturaMinima: -20, // Vale mais profundo do relevo
      sementeRuido: 1337, // Semente fixa do gerador matemático (terreno sempre idêntico)
    },
    arvores: {
      gradesColunas: 20, // Divisões na horizontal para espalhar os troncos
      gradesLinhas: 20, // Divisões na vertical para espalhar os troncos
      distanciaMinima: 50, // Distância física limite para uma árvore não nascer em cima da outra
      alturaMinimaNascimento: -10, // Altitude limite para vegetação rasteira
      alturaMaximaNascimento: 50, // Altitude máxima antes de virar rocha nua ou neve
    },
  },

  // === CONFIGURAÇÕES DE TEMPO E VELOCIDADES DE MODOS ===
  modos: {
    tempoModoEspecial: 10.0,
    tempoTransicaoOnda: 5.0,
    velocidadeJogoPadrao: 0.8,
    velocidadeTecla1: 0.8,
    velocidadeTecla2: 1.2,
    velocidadeTecla3: 1.8,
  },
};
