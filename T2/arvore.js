/**
 * @file arvore.js
 * Cria dois tipos de árvore 3D para popular os tiles do cenário.
 */

import * as THREE from 'three';

/** Cores possíveis para as folhas das árvores. */
const COR_FOLHA = ["#738417", "#2e6f40", "#388347", "#BF5B05", "#92780A"];
// Escalas pré-definidas; tiles.js sobrescreve com lerp - usadas só na criação inicial
const ESCALAS_POSSIVEIS = [2, 3, 2.5, 4];

// Material de madeira compartilhado entre todas as árvores (criado uma única vez)
const madeira = new THREE.MeshToonMaterial({color: "brown"});

// --- Geometrias pré-criadas (compartilhadas entre todas as instâncias) ---
// Tipo 1: parecida com um pinheiro
const geomTronco1 = new THREE.CylinderGeometry(1, 1, 6);       // tronco reto
const geomFolha1  = new THREE.CylinderGeometry(0, 4,   4);     // camada base (maior)
const geomFolha2  = new THREE.CylinderGeometry(0, 3.5, 3.5);
const geomFolha3  = new THREE.CylinderGeometry(0, 3,   3);
const geomFolha4  = new THREE.CylinderGeometry(0, 2.5, 2.5);
const geomFolha5  = new THREE.CylinderGeometry(0, 2,   2.5);   // ponta (menor)

// Tipo 2: folhagem arredondada em cima e galho com folhagem menor lateral
const geomTronco2 = new THREE.CylinderGeometry(0.5, 0.5, 5);  // tronco mais fino
const geomGalho1  = new THREE.CylinderGeometry(0.3, 0.3, 2.5); // galho inclinado
const geomFolha6  = new THREE.SphereGeometry(2);               // copa principal
const geomFolha7  = new THREE.SphereGeometry(1.5);             // copa secundária no galho

/**
 * Cria e adiciona uma árvore à cena.
 * @param {THREE.Scene} scene
 * @param {1|2} tipo - Tipo 1: conífera em camadas. Tipo 2: árvore com copa esférica.
 * @returns {{ object: THREE.Mesh }} Objeto raiz da árvore.
 */
export function criaArvore(scene, tipo) {
  // Cor e escala sorteadas aleatoriamente a cada criação
  const corAleatorio   = COR_FOLHA[Math.floor(Math.random() * COR_FOLHA.length)];
  const folha          = new THREE.MeshToonMaterial({color: corAleatorio});
  const escalaSorteada = ESCALAS_POSSIVEIS[Math.floor(Math.random() * ESCALAS_POSSIVEIS.length)];

  let object;

  if (tipo === 1) {
    // Conífera: tronco com 5 camadas cônicas sobrepostas, cada uma menor e mais alta
    const objetoTipo1 = new THREE.Mesh(geomTronco1, madeira);
    objetoTipo1.position.set(4, 3, 0); // posição provisória; tiles.js reposiciona

    const folhas1 = new THREE.Mesh(geomFolha1, folha);
    const folhas2 = new THREE.Mesh(geomFolha2, folha);
    const folhas3 = new THREE.Mesh(geomFolha3, folha);
    const folhas4 = new THREE.Mesh(geomFolha4, folha);
    const folhas5 = new THREE.Mesh(geomFolha5, folha);

    // Camadas empilhadas ao longo do Y — cada uma um pouco mais alta
    folhas1.position.set(0, 2, 0);
    folhas2.position.set(0, 3, 0);
    folhas3.position.set(0, 4, 0);
    folhas4.position.set(0, 5, 0);
    folhas5.position.set(0, 6, 0);

    objetoTipo1.add(folhas1, folhas2, folhas3, folhas4, folhas5);
    object = objetoTipo1;
  } else {
    // Folha larga: tronco fino com galho inclinado e duas copas esféricas
    const objetoTipo2 = new THREE.Mesh(geomTronco2, madeira);
    objetoTipo2.position.set(-4, 2.5, 0);

    const galho1 = new THREE.Mesh(geomGalho1, madeira);
    galho1.rotateX(THREE.MathUtils.degToRad(60)); // inclina o galho para fora
    galho1.position.set(0, 0, 1);

    const folhas6 = new THREE.Mesh(geomFolha6, folha); // copa no topo do tronco
    folhas6.position.set(0, 2.5, 0);

    const folhas7 = new THREE.Mesh(geomFolha7, folha); // copa menor na ponta do galho
    folhas7.position.set(0, 1.7, 3);

    objetoTipo2.add(galho1, folhas6, folhas7);
    object = objetoTipo2;
  }

  // Aplica a escala sorteada uniformemente nos 3 eixos
  object.scale.set(escalaSorteada, escalaSorteada, escalaSorteada);

  object.traverse(function (o) { o.castShadow = true });

  scene.add(object);

  return { object };
}
