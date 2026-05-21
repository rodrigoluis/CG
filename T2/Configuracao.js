/**
 * @file Configuracao.js
 * Centraliza os parâmetros de balanceamento e design do jogo para fácil alteração.
 */

export const CONFIG = {
  // === CONFIGURAÇÕES DOS INIMIGOS ===
  inimigos: {
    velocidadePerseguicao: 2.0,
    velocidadeZigueZague: 1.4,
    intervaloTiro: 1.5,
    delayPrimeiroTiro: -2.0,
    posicaoZCombate: 140,
    distanciaSpawnZ: 800,
  },

  // === CONFIGURAÇÕES DO SISTEMA DE LASERS ===
  lasers: {
    velocidadeJogador: 4.0,
    velocidadeInimigo: 2.0,
    cadenciaJogador: 0.1,
    distanciaSumiçoPerto: -140,
  },

  // === CONFIGURAÇÕES DE TEMPO, MODOS E VELOCIDADES DO JOGO ===
  modos: {
    tempoModoEspecial: 10.0,
    tempoTransicaoOnda: 5.0,
    velocidadeJogoPadrao: 0.8, // Sincronizado com a sua inicialização (gameSpeed = 0.8)

    // === ADICIONE ESTES NOVOS PARÂMETROS ABAIXO ===
    velocidadeTecla1: 0.8, // Velocidade ao pressionar a tecla "1"
    velocidadeTecla2: 1.2, // Velocidade ao pressionar a tecla "2"
    velocidadeTecla3: 1.8, // Velocidade ao pressionar a tecla "3"
  },
};
