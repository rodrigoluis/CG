import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
    initRenderer,
    initCamera,
    initDefaultBasicLight,
    setDefaultMaterial,
    onWindowResize,
    createGroundPlaneWired
} from '../libs/util/util.js';
import Fire from '../assets/shaders/fire/fire.js';


let scene = new THREE.Scene();
let renderer = initRenderer();
let camera = initCamera(new THREE.Vector3(2, 4, 5));

window.addEventListener('resize', () => {
   onWindowResize(camera, renderer);
}, false);

initDefaultBasicLight(scene, true, new THREE.Vector3(25, 30, 20));
const orbit = new OrbitControls(camera, renderer.domElement);

const plane = createGroundPlaneWired(
   7, 7, 7, 7, 3, 'darkseagreen', 'darkolivegreen'
);
scene.add(plane);

const textureLoader = new THREE.TextureLoader();
const cubeTex = textureLoader.load('../assets/textures/crate.jpg');
cubeTex.colorSpace = THREE.SRGBColorSpace;

const cube = new THREE.Mesh(
   new THREE.BoxGeometry(1, 1, 1),
   setDefaultMaterial(null, cubeTex)
);
cube.position.set(0, 0.5, 0);
cube.castShadow = true;
scene.add(cube);

// Carrega os arquivos GLSL como texto. Execute via servidor HTTP,
// pois fetch() não funciona corretamente ao abrir o HTML com file://.
const [vertexShader, fragmentShader] = await Promise.all([
   fetch('../assets/shaders/fire/fire.vert').then(response => {
      if (!response.ok) throw new Error('Não foi possível carregar fireVS.glsl');
      return response.text();
   }),
   fetch('../assets/shaders/fire/fire.frag').then(response => {
      if (!response.ok) throw new Error('Não foi possível carregar fireFS.glsl');
      return response.text();
   })
]);

const fireTex = textureLoader.load('../assets/textures/fire.png');
const fire = new Fire(fireTex, vertexShader, fragmentShader);
   fire.scale.set(1.0, 3.0, 1.0);
   fire.position.set(0.0, 2.5, 0.0);
scene.add(fire);

const clock = new THREE.Timer();
render();

function render() {
   fire.update(clock);
   requestAnimationFrame(render);
   renderer.render(scene, camera);
}
    