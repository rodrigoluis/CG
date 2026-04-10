import * as THREE from  'three';
import { OrbitControls } from '../../build/jsm/controls/OrbitControls.js';
import KeyboardState from "../../libs/util/KeyboardState.js";
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../../libs/util/util.js";

let scene, renderer, camera, material, light, orbit ; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
scene.add(camera); // Add camera to the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// criando materiais
let materialRosa, materialBranco, materialDetalhe;
materialRosa = setDefaultMaterial('rgb(233, 65,150)');
materialBranco = setDefaultMaterial('branco');
materialDetalhe = setDefaultMaterial('dark pink');

//CorpoAviao
const cilindroCorpo = new THREE.CylinderGeometry(3, 3, 10, 80);
const cubeAsa = new THREE.ConeGeometry(4, 2, 2);
const sphereoNariz = new THREE.SphereGeometry(3, 80);
const sphereoRabo = new THREE.SphereGeometry(3, 80);
const corpo = new THREE.Mesh(cilindroCorpo, materialRosa); 
const nariz = new THREE.Mesh(sphereoNariz, materialBranco);
const rabo = new THREE.Mesh(sphereoRabo, materialBranco);
const basa = new THREE.Mesh(cubeAsa, materialBranco);
let angle = THREE.MathUtils.degToRad(90);
corpo.position.set(0, 5, 0);
corpo.add(nariz);
corpo.add(basa);
corpo.add(rabo);
nariz.position.set(0, 5, 0);
basa.position.set(0, 10, 0);
rabo.position.set(0, -5, 0);
corpo.rotateX(angle);
scene.add(corpo);

//Controles basicos para teste
var keyboard = new KeyboardState();
function keyboardUpdate() {
  keyboard.update();
  if (keyboard.pressed("left")) corpo.translateX(-1);
  if (keyboard.pressed("right")) corpo.translateX(1);
  if (keyboard.pressed("up")) corpo.translateY(1);
  if (keyboard.pressed("down")) corpo.translateY(-1);
  if (keyboard.pressed("pageup")) corpo.translateZ(1);
  if (keyboard.pressed("pagedown")) corpo.translateZ(-1);

  let angle = THREE.MathUtils.degToRad(10);
  if (keyboard.pressed("A")) corpo.rotateY(angle);
  if (keyboard.pressed("D")) corpo.rotateY(-angle);
}



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
  keyboardUpdate();
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}