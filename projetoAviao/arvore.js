import * as THREE from  'three';
import { OrbitControls } from '../../build/jsm/controls/OrbitControls.js';
import GUI from '../../libs/util/dat.gui.module.js'
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../../libs/util/util.js";

export class Arvores {
  constructor(scene, tipo) {
    let madeira, folha;
    let cor = ["#738417", "#2e6f40", "#388347", "#BF5B05", "#92780A"];
    let corAleatorio = cor[Math.floor(Math.random() * cor.length)];
    folha = setDefaultMaterial(corAleatorio); // create a basic material
    madeira = setDefaultMaterial("brown"); // create a basic materialn, zoom etc.

    // cria um tronco
    let TroncoGeometry1 = new THREE.CylinderGeometry(1, 1, 6);
    const objetoTipo1 = new THREE.Mesh(TroncoGeometry1, madeira);

    // posição da árvore 1
    objetoTipo1.position.set(4.0, 3.0, 0.0);
    // adicionando a árvore 1 na cena

    let FolhaGeometry1 = new THREE.CylinderGeometry(0, 4, 4);
    let folhas1 = new THREE.Mesh(FolhaGeometry1, folha);

    let FolhaGeometry2 = new THREE.CylinderGeometry(0, 3.5, 3.5);
    let folhas2 = new THREE.Mesh(FolhaGeometry2, folha);

    let FolhaGeometry3 = new THREE.CylinderGeometry(0, 3, 3);
    let folhas3 = new THREE.Mesh(FolhaGeometry3, folha);

    let FolhaGeometry4 = new THREE.CylinderGeometry(0, 2.5, 2.5);
    let folhas4 = new THREE.Mesh(FolhaGeometry4, folha);

    let FolhaGeometry5 = new THREE.CylinderGeometry(0, 2, 2.5);
    let folhas5 = new THREE.Mesh(FolhaGeometry5, folha);

    objetoTipo1.add(folhas1);
    objetoTipo1.add(folhas2);
    objetoTipo1.add(folhas3);
    objetoTipo1.add(folhas4);
    objetoTipo1.add(folhas5);

    folhas1.position.set(0.0, 2.0, 0.0);
    folhas2.position.set(0.0, 3.0, 0.0);
    folhas3.position.set(0.0, 4.0, 0.0);
    folhas4.position.set(0.0, 5.0, 0.0);
    folhas5.position.set(0.0, 6.0, 0.0);

    // cria um tronco para a segunda árvore
    let TroncoGeometry2 = new THREE.CylinderGeometry(0.5, 0.5, 5);
    const objetoTipo12 = new THREE.Mesh(TroncoGeometry2, madeira);
    // posição da árvore 2
    objetoTipo12.position.set(-4.0, 2.5, 0.0);
    // adicionando a árvore 2 na cena

    let GalhoGeometry1 = new THREE.CylinderGeometry(0.3, 0.3, 2.5);
    let galho1 = new THREE.Mesh(GalhoGeometry1, madeira);
    galho1.rotateX(THREE.MathUtils.degToRad(60.0));
    objetoTipo12.add(galho1);
    galho1.position.set(0.0, 0, 1.0);

    let FolhaGeometry6 = new THREE.SphereGeometry(2);
    let folhas6 = new THREE.Mesh(FolhaGeometry6, folha);

    let FolhaGeometry7 = new THREE.SphereGeometry(1.5);
    let folhas7 = new THREE.Mesh(FolhaGeometry7, folha);

    objetoTipo12.add(folhas6);
    folhas6.position.set(0.0, 2.5, 0.0);

    objetoTipo12.add(folhas7);
    folhas7.position.set(0.0, 1.7, 3);

    //Tamanhos aleatorios
    const escalasPossiveis = [0.8, 1.5, 2, 2.5];
    const escalaSorteada =
      escalasPossiveis[Math.floor(Math.random() * escalasPossiveis.length)];
    
    objetoTipo1.scale.set(escalaSorteada, escalaSorteada, escalaSorteada);
    objetoTipo12.scale.set(escalaSorteada, escalaSorteada, escalaSorteada);

    // Aqui definimos quem será o "objetoTipo1" para o main.js não dar erro
    if (tipo === 1) {
      this.object = objetoTipo1;
    } else {
      this.object = objetoTipo12;
    }

    // Aplica a escala no objeto escolhido
    this.object.scale.set(escalaSorteada, escalaSorteada, escalaSorteada);

    // Adiciona o objeto escolhido na cena
    scene.add(this.object);
  }
}
