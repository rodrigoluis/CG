import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import GUI from '../libs/util/dat.gui.module.js'
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, madeira, folha, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
folha = setDefaultMaterial('green'); // create a basic material
madeira = setDefaultMaterial('brown'); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// cria um tronco
let TroncoGeometry1 = new THREE.CylinderGeometry(1, 1, 6);
let arvore1 = new THREE.Mesh(TroncoGeometry1, madeira);

// posição da árvore 1
arvore1.position.set(4.0, 3.0, 0.0);
// adicionando a árvore 1 na cena
scene.add(arvore1);

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

arvore1.add(folhas1);
arvore1.add(folhas2);
arvore1.add(folhas3);
arvore1.add(folhas4);
arvore1.add(folhas5);

folhas1.position.set(0.0, 2.0, 0.0);
folhas2.position.set(0.0, 3.0, 0.0);
folhas3.position.set(0.0, 4.0, 0.0);
folhas4.position.set(0.0, 5.0, 0.0);
folhas5.position.set(0.0, 6.0, 0.0);

// cria um tronco para a segunda árvore
let TroncoGeometry2 = new THREE.CylinderGeometry(0.5, 0.5, 5);
let arvore2 = new THREE.Mesh(TroncoGeometry2, madeira);
// posição da árvore 2
arvore2.position.set(-4.0, 2.5, 0.0);
// adicionando a árvore 2 na cena
scene.add(arvore2);

let GalhoGeometry1 = new THREE.CylinderGeometry(0.3, 0.3, 2.5);
let galho1 = new THREE.Mesh(GalhoGeometry1, madeira);
galho1.rotateX(THREE.MathUtils.degToRad(60.0));
arvore2.add(galho1);
galho1.position.set(0.0, 0, 1.0);


let FolhaGeometry6 = new THREE.SphereGeometry(2);
let folhas6 = new THREE.Mesh(FolhaGeometry6, folha);

let FolhaGeometry7 = new THREE.SphereGeometry(1.5);
let folhas7 = new THREE.Mesh(FolhaGeometry7, folha);

arvore2.add(folhas6);
folhas6.position.set(0.0, 2.5, 0.0);

arvore2.add(folhas7);
folhas7.position.set(0.0, 1.7, 3);




let guiParams = { scale: 1.0 };
let gui = new GUI();
gui.add(guiParams, 'scale', 0.2, 3.0, 0.1)
  .name('Escala Arvore')
  .onChange(function (value) {
    arvore1.scale.set(value, value, value);
    arvore2.scale.set(value, value, value);
  });

// Use this to show information onscreen
let controls = new InfoBox();
  controls.add("Basic Scene");
  controls.addParagraph();
  controls.add("Use mouse to interact:");
  controls.add("* Left button to rotate");
  controls.add("* Right button to translate (pan)");
  controls.add("* Scroll to zoom in/out.");
  controls.show();

render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}