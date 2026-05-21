/**
 * @file aviao.js
 * Constrói o modelo 3D do avião (corpo, asas, leme e detalhes).
 */

import * as THREE from 'three';
import {
  setDefaultMaterial
} from "../../libs/util/util.js";

/**
 * Cria e adiciona o avião à cena.
 * @param {THREE.Scene} scene
 * @returns {{ object: THREE.Mesh }} Objeto raiz do avião.
 */
export function criaAviao(scene) {
  // --- Materiais ---
  let materialRosa, materialBranco, materialDetalhe;
  materialRosa    = setDefaultMaterial("rgb(233, 65,150)");  // fuselagem
  materialBranco  = setDefaultMaterial("white");             // asas e nariz
  materialDetalhe = setDefaultMaterial("rgb(255, 217, 2)");  // detalhes amarelos

  // --- Geometrias (formas brutas, sem posição ainda) ---
  const cilindroCorpo = new THREE.CylinderGeometry(3, 2.6, 10, 80);    // fuselagem cilíndrica
  const asa           = new THREE.CylinderGeometry(1.2, 2.8, 12, 5);   // asa com perfil pentagonal
  const sphereoNariz  = new THREE.CapsuleGeometry(3, 2, 3, 80);        // nariz arredondado
  const sphereoRabo   = new THREE.SphereGeometry(2.6, 80, 5);          // tampa traseira
  const cilindroRabo  = new THREE.CapsuleGeometry(1, 5, 2, 30);        // empenagem horizontal
  const cilindroLeme  = new THREE.CylinderGeometry(2, 1, 6.5);         // leme vertical
  const cilindroKitty = new THREE.CylinderGeometry(0.1, 2, 1, 3);      // orelhas da Hello Kitty
  const sphereFofo    = new THREE.CapsuleGeometry(0.3, 0.5, 0.3, 80);  // nó de fita (objeto raiz)

  // --- Meshes (geometria + material) ---
  const corpo     = new THREE.Mesh(cilindroCorpo, materialRosa);
  const nariz     = new THREE.Mesh(sphereoNariz,  materialBranco);
  const rabo      = new THREE.Mesh(sphereoRabo,   materialBranco);
  const empenagem = new THREE.Mesh(cilindroRabo,  materialRosa);
  const basa1     = new THREE.Mesh(asa,           materialBranco); // asa esquerda
  const basa2     = new THREE.Mesh(asa,           materialBranco); // asa direita
  const leme      = new THREE.Mesh(cilindroLeme,  materialBranco);
  const roda1     = new THREE.Mesh(cilindroRabo,  materialDetalhe); // detalhe frontal
  const kitty     = new THREE.Mesh(cilindroKitty, materialDetalhe); // orelha direita
  const kitty2    = new THREE.Mesh(cilindroKitty, materialDetalhe); // orelha esquerda
  const object    = new THREE.Mesh(sphereFofo,    materialDetalhe); // raiz da hierarquia

  let angle = THREE.MathUtils.degToRad(90); // 90° em radianos, usado em várias rotações

  // --- Hierarquia de objetos ---
  // corpo é filho de object; nariz, asas, rabo etc. são filhos de corpo
  corpo.position.set(0, 5, 0);
  corpo.add(nariz, basa1, basa2, rabo, leme, roda1, kitty, kitty2);
  leme.add(empenagem); // empenagem horizontal presa ao leme vertical

  // --- Posicionamento e rotação de cada parte relativa ao seu pai ---

  // Asas giradas 135° para ficarem horizontais (cilindro nasce vertical)
  basa2.rotateZ(-1.5 * angle);
  basa1.rotateZ( 1.5 * angle);
  basa1.position.set(-3.5, 0, 0); // asa esquerda
  basa2.position.set( 3.5, 0, 0); // asa direita

  nariz.position.set(0,  5,   0); // frente do avião
  rabo.position.set( 0, -5.5, 0); // tampa da cauda

  roda1.scale.set(1, 1, 0.5);     // achata a cápsula para parecer um disco
  roda1.position.set(0, 2, 2.6);  // detalhe na barriga

  // Orelhas da Hello Kitty: rotacionadas para ficarem em pé
  kitty.rotateX(0.5 * angle);
  kitty.position.set( 2.5, 7, -1);
  kitty2.rotateX(0.5 * angle);
  kitty2.position.set(-2.5, 7, -1);

  object.position.set(0, 8.8, 0); // posição inicial do nó raiz

  // Leme vertical na cauda, inclinado para frente
  leme.position.set(0, -7.2, -1.2);
  leme.rotateX(0.5 * angle);
  empenagem.rotateZ(angle);       // empenagem horizontal (90° do leme)
  empenagem.translateX(-2);       // desloca para o lado após rotacionar

  // Corpo principal girado 90° para que o "topo" do cilindro aponte para frente
  corpo.rotateX(angle);
  object.add(corpo);
  corpo.position.set(0, 0, -8.8); // reposiciona após a rotação para centralizar
  corpo.scale.set(0.6, 0.6, 0.6);

  scene.add(object); // adiciona o avião inteiro à cena por meio do objeto raiz

  return { object };
}
