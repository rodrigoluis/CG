import * as THREE from  'three';
import { OrbitControls } from '../../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../../libs/util/util.js";

//Scene tem que ser atributo da classe 
export class Aviao {
  constructor(scene) {
    // criando materiais
    let materialRosa, materialBranco, materialDetalhe;
    materialRosa = setDefaultMaterial("rgb(233, 65,150)");
    materialBranco = setDefaultMaterial("branco");
    materialDetalhe = setDefaultMaterial("rgb(255, 217, 2)");

    //CorpoAviao
    const cilindroCorpo = new THREE.CylinderGeometry(3, 2.6, 10, 80);
    const Asa = new THREE.CylinderGeometry(1.2, 2.8, 12, 5);
    const sphereoNariz = new THREE.CapsuleGeometry(3, 2, 3, 80);
    const sphereoRabo = new THREE.SphereGeometry(2.6, 80, 5);
    const cilindroRabo = new THREE.CapsuleGeometry(1, 5, 2, 80);
    const cilindroLeme = new THREE.CylinderGeometry(2, 1, 6.5);

    this.object = new THREE.Mesh(cilindroCorpo, materialRosa);
    const nariz = new THREE.Mesh(sphereoNariz, materialBranco);
    const rabo = new THREE.Mesh(sphereoRabo, materialBranco);
    const empenagem = new THREE.Mesh(cilindroRabo, materialRosa);
    const basa1 = new THREE.Mesh(Asa, materialBranco);
    const basa2 = new THREE.Mesh(Asa, materialBranco);
    const leme = new THREE.Mesh(cilindroLeme, materialBranco);
    const roda1 = new THREE.Mesh(cilindroRabo, materialDetalhe);
    const roda2 = new THREE.Mesh(cilindroRabo, materialDetalhe);

    let angle = THREE.MathUtils.degToRad(90);

    this.object.position.set(0, 5, 0);
    this.object.add(nariz, basa1, basa2, rabo, leme, roda1, roda2);
    leme.add(empenagem);

    basa2.rotateZ(-1.5 * angle);
    basa1.rotateZ(1.5 * angle);
    basa1.position.set(-3.5, 0, 0);
    basa2.position.set(3.5, 0, 0);
    nariz.position.set(0, 5, 0);
    rabo.position.set(0, -5.5, 0);
    roda1.scale.set(0.5, 0.5, 0.5);
    roda2.scale.set(0.5, 0.5, 0.5);
    roda1.position.set(0, 2, 2.5);
    roda1.rotateZ(angle);
    roda2.rotateZ(angle);
    roda2.position.set(0, -3, 2.5);

    leme.position.set(0, -7.2, -1.2);
    leme.rotateX(0.5 * angle);
    empenagem.rotateZ(angle);
    empenagem.translateX(-2);

    this.object.rotateX(angle);
    scene.add(this.object);
  }
}
