/**
 * @file arvore.js
 * Cria dois tipos de árvore 3D para popular os tiles do cenário.
 *
 * As árvores são construídas na origem local (0, 0, 0) e não são adicionadas
 * a nenhum pai aqui — quem chama criaArvore é responsável por adicionar o
 * objeto retornado ao tile ou à cena e definir sua posição.
 */

import * as THREE from 'three';
import { setDefaultMaterial } from "../../libs/util/util.js";

/** Cores possíveis para as folhas das árvores. */
const COR_FOLHA = ["#738417", "#2e6f40", "#388347", "#BF5B05", "#92780A"];

/** Escalas possíveis — sorteadas aleatoriamente a cada criação. */
const ESCALAS_POSSIVEIS = [0.75, 1, 1.5, 1.75];

// Material de madeira compartilhado entre todas as instâncias (criado uma única vez)
const madeira = setDefaultMaterial("brown");

// ---------------------------------------------------------------------------
// Geometrias pré-criadas e compartilhadas entre todas as instâncias.
// Criar geometrias uma única vez e reutilizá-las reduz alocações de memória na GPU.
// ---------------------------------------------------------------------------

// Tipo 1 — conífera em camadas (estilo pinheiro)
const geomTronco1 = new THREE.CylinderGeometry(1, 1, 6);     // tronco reto
const geomFolha1  = new THREE.CylinderGeometry(0, 4,   4);   // camada base (maior)
const geomFolha2  = new THREE.CylinderGeometry(0, 3.5, 3.5);
const geomFolha3  = new THREE.CylinderGeometry(0, 3,   3);
const geomFolha4  = new THREE.CylinderGeometry(0, 2.5, 2.5);
const geomFolha5  = new THREE.CylinderGeometry(0, 2,   2.5); // ponta (menor)

// Tipo 2 — árvore de folha larga com copa esférica e galho lateral
const geomTronco2 = new THREE.CylinderGeometry(0.5, 0.5, 5);  // tronco mais fino
const geomGalho1  = new THREE.CylinderGeometry(0.3, 0.3, 2.5); // galho inclinado
const geomFolha6  = new THREE.SphereGeometry(2);               // copa principal
const geomFolha7  = new THREE.SphereGeometry(1.5);             // copa secundária no galho

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Constrói uma árvore 3D e retorna seu objeto raiz.
 *
 * A árvore é posicionada na origem (0, 0, 0) em espaço local.
 * Quem chama esta função deve adicioná-la a um pai (tile, cena, etc.)
 * e definir sua posição final.
 *
 * @param {1|2} tipo - Tipo 1: conífera em camadas. Tipo 2: árvore com copa esférica.
 * @returns {THREE.Mesh} Objeto raiz da árvore (já com filhos e escala aplicados).
 */
export function criaArvore(tipo) {
  const corAleatorio   = COR_FOLHA[Math.floor(Math.random() * COR_FOLHA.length)];
  const folha          = setDefaultMaterial(corAleatorio);
  const escalaSorteada = ESCALAS_POSSIVEIS[Math.floor(Math.random() * ESCALAS_POSSIVEIS.length)];

  let object;

  if (tipo === 1) {
    // Conífera: tronco com 5 camadas cônicas sobrepostas, cada uma menor e mais alta
    object = new THREE.Mesh(geomTronco1, madeira);

    const folhas1 = new THREE.Mesh(geomFolha1, folha);
    const folhas2 = new THREE.Mesh(geomFolha2, folha);
    const folhas3 = new THREE.Mesh(geomFolha3, folha);
    const folhas4 = new THREE.Mesh(geomFolha4, folha);
    const folhas5 = new THREE.Mesh(geomFolha5, folha);

    // Camadas empilhadas ao longo do Y — cada uma um pouco mais alta que a anterior
    folhas1.position.set(0, 2,   0);
    folhas2.position.set(0, 3,   0);
    folhas3.position.set(0, 4,   0);
    folhas4.position.set(0, 5,   0);
    folhas5.position.set(0, 6,   0);

    object.add(folhas1, folhas2, folhas3, folhas4, folhas5);

  } else {
    // Folha larga: tronco fino com galho inclinado e duas copas esféricas
    object = new THREE.Mesh(geomTronco2, madeira);

    const galho1  = new THREE.Mesh(geomGalho1, madeira);
    galho1.rotateX(THREE.MathUtils.degToRad(60)); // inclina o galho para fora do tronco
    galho1.position.set(0, 0, 1);

    const folhas6 = new THREE.Mesh(geomFolha6, folha); // copa no topo do tronco
    folhas6.position.set(0, 2.5, 0);

    const folhas7 = new THREE.Mesh(geomFolha7, folha); // copa menor na ponta do galho
    folhas7.position.set(0, 1.7, 3);

    object.add(galho1, folhas6, folhas7);
  }

  object.scale.set(escalaSorteada, escalaSorteada, escalaSorteada);

  return object;
}
