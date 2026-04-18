import * as THREE from 'three';
import {
  setDefaultMaterial
} from "../../libs/util/util.js";

const COR_FOLHA = ["#738417", "#2e6f40", "#388347", "#BF5B05", "#92780A"];
const ESCALAS_POSSIVEIS = [2, 3, 2.5, 4];

const madeira = setDefaultMaterial("brown");

const geomTronco1 = new THREE.CylinderGeometry(1, 1, 6);
const geomFolha1 = new THREE.CylinderGeometry(0, 4, 4);
const geomFolha2 = new THREE.CylinderGeometry(0, 3.5, 3.5);
const geomFolha3 = new THREE.CylinderGeometry(0, 3, 3);
const geomFolha4 = new THREE.CylinderGeometry(0, 2.5, 2.5);
const geomFolha5 = new THREE.CylinderGeometry(0, 2, 2.5);

const geomTronco2 = new THREE.CylinderGeometry(0.5, 0.5, 5);
const geomGalho1 = new THREE.CylinderGeometry(0.3, 0.3, 2.5);
const geomFolha6 = new THREE.SphereGeometry(2);
const geomFolha7 = new THREE.SphereGeometry(1.5);

export function criaArvore(scene, tipo) {
  const corAleatorio = COR_FOLHA[Math.floor(Math.random() * COR_FOLHA.length)];
  const folha = setDefaultMaterial(corAleatorio);
  const escalaSorteada = ESCALAS_POSSIVEIS[Math.floor(Math.random() * ESCALAS_POSSIVEIS.length)];

  let object;

  if (tipo === 1) {
    const objetoTipo1 = new THREE.Mesh(geomTronco1, madeira);
    objetoTipo1.position.set(4, 3, 0);

    const folhas1 = new THREE.Mesh(geomFolha1, folha);
    const folhas2 = new THREE.Mesh(geomFolha2, folha);
    const folhas3 = new THREE.Mesh(geomFolha3, folha);
    const folhas4 = new THREE.Mesh(geomFolha4, folha);
    const folhas5 = new THREE.Mesh(geomFolha5, folha);

    folhas1.position.set(0, 2, 0);
    folhas2.position.set(0, 3, 0);
    folhas3.position.set(0, 4, 0);
    folhas4.position.set(0, 5, 0);
    folhas5.position.set(0, 6, 0);

    objetoTipo1.add(folhas1, folhas2, folhas3, folhas4, folhas5);
    object = objetoTipo1;
  } else {
    const objetoTipo2 = new THREE.Mesh(geomTronco2, madeira);
    objetoTipo2.position.set(-4, 2.5, 0);

    const galho1 = new THREE.Mesh(geomGalho1, madeira);
    galho1.rotateX(THREE.MathUtils.degToRad(60));
    galho1.position.set(0, 0, 1);

    const folhas6 = new THREE.Mesh(geomFolha6, folha);
    folhas6.position.set(0, 2.5, 0);

    const folhas7 = new THREE.Mesh(geomFolha7, folha);
    folhas7.position.set(0, 1.7, 3);

    objetoTipo2.add(galho1, folhas6, folhas7);
    object = objetoTipo2;
  }

  object.scale.set(escalaSorteada, escalaSorteada, escalaSorteada);
  scene.add(object);

  return { object };
}
