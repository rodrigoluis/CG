import * as THREE from 'three';
import {
  setDefaultMaterial
} from "../../libs/util/util.js";

export function criaAviao(scene) {
  // criando materiais
  let materialRosa, materialBranco, materialDetalhe;
  materialRosa = setDefaultMaterial("rgb(233, 65,150)");
  materialBranco = setDefaultMaterial("white");
  materialDetalhe = setDefaultMaterial("rgb(255, 217, 2)");

  //CorpoAviao
  const cilindroCorpo = new THREE.CylinderGeometry(3, 2.6, 10, 80);
  const asa = new THREE.CylinderGeometry(1.2, 2.8, 12, 5);
  const sphereoNariz = new THREE.CapsuleGeometry(3, 2, 3, 80);
  const sphereoRabo = new THREE.SphereGeometry(2.6, 80, 5);
  const cilindroRabo = new THREE.CapsuleGeometry(1, 5, 2, 30);
  const cilindroLeme = new THREE.CylinderGeometry(2, 1, 6.5);
  const cilindroKitty = new THREE.CylinderGeometry(0.1, 2, 1, 3);
  const sphereFofo = new THREE.CapsuleGeometry(0.3, 0.5, 0.3, 80);

  const corpo = new THREE.Mesh(cilindroCorpo, materialRosa);
  const nariz = new THREE.Mesh(sphereoNariz, materialBranco);
  const rabo = new THREE.Mesh(sphereoRabo, materialBranco);
  const empenagem = new THREE.Mesh(cilindroRabo, materialRosa);
  const basa1 = new THREE.Mesh(asa, materialBranco);
  const basa2 = new THREE.Mesh(asa, materialBranco);
  const leme = new THREE.Mesh(cilindroLeme, materialBranco);
  const roda1 = new THREE.Mesh(cilindroRabo, materialDetalhe);
  const kitty = new THREE.Mesh(cilindroKitty, materialDetalhe);
  const kitty2 = new THREE.Mesh(cilindroKitty, materialDetalhe);
  const object = new THREE.Mesh(sphereFofo, materialDetalhe);

  let angle = THREE.MathUtils.degToRad(90);

  corpo.position.set(0, 5, 0);
  corpo.add(nariz, basa1, basa2, rabo, leme, roda1, kitty, kitty2);
  leme.add(empenagem);

  basa2.rotateZ(-1.5 * angle);
  basa1.rotateZ(1.5 * angle);
  basa1.position.set(-3.5, 0, 0);
  basa2.position.set(3.5, 0, 0);
  nariz.position.set(0, 5, 0);
  rabo.position.set(0, -5.5, 0);
  roda1.scale.set(1, 1, 0.5);
  roda1.position.set(0, 2, 2.6);
  kitty.rotateX(0.5 * angle);
  kitty.position.set(2.5, 7, -1);
  kitty2.rotateX(0.5 * angle);
  kitty2.position.set(-2.5, 7, -1);
  object.position.set(0, 8.8, 0);

  leme.position.set(0, -7.2, -1.2);
  leme.rotateX(0.5 * angle);
  empenagem.rotateZ(angle);
  empenagem.translateX(-2);

  corpo.rotateX(angle);
  object.add(corpo);
  corpo.position.set(0, 0, -8.8);
  scene.add(object);

  return { object };
}
