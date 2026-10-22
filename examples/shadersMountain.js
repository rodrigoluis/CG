import * as THREE from 'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {
    initRenderer,
    initCamera,
    initDefaultBasicLight,
    onWindowResize,
    createGroundPlaneWired
} from '../libs/util/util.js';

import Mountain from '../assets/shaders/mountain/mountain.js';

let scene, renderer, camera, light, orbit;

scene = new THREE.Scene();
scene.background = new THREE.Color(0.72, 0.84, 0.95);

renderer = initRenderer();
camera = initCamera(new THREE.Vector3(7, 5, 7));
camera.lookAt(0, 0.7, 0);

window.addEventListener('resize', () => {
    onWindowResize(camera, renderer);
}, false);

light = initDefaultBasicLight(scene, true, new THREE.Vector3(10, 15, 10));
orbit = new OrbitControls(camera, renderer.domElement);

// const ground = createGroundPlaneWired(
//     8, 8, 8, 8, 3, 'darkseagreen', 'darkolivegreen'
// );
// ground.position.y = -0.03;
// scene.add(ground);

const [vertexShader, fragmentShader] = await Promise.all([
   fetch('../assets/shaders/mountain/mountain.vert').then(response => {
      if (!response.ok) throw new Error('Não foi possível carregar o vertex shader');
      return response.text();
   }),
   fetch('../assets/shaders/mountain/mountain.frag').then(response => {
      if (!response.ok) throw new Error('Não foi possível carregar o fragment shader');
      return response.text();
   })
]);
const mountain = new Mountain(vertexShader, fragmentShader);
scene.add(mountain);

render();

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
